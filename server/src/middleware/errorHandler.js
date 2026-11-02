import multer from 'multer';
import { AppError } from '../utils/httpError.js';
import env from '../config/env.js';

const duplicateCode = (message = '') => {
  const text = message.toLowerCase();
  if (text.includes('email')) return ['DUPLICATE_EMAIL', 'This email is already registered.'];
  if (text.includes('phone')) return ['DUPLICATE_PHONE', 'This phone number is already registered.'];
  if (text.includes('national_id')) {
    return ['DUPLICATE_NATIONAL_ID', 'This national ID is already registered.'];
  }
  if (text.includes('tracking')) {
    return ['DUPLICATE_TRACKING_NUMBER', 'This tracking number already exists.'];
  }
  if (text.includes('head_district')) {
    return ['DISTRICT_HEAD_EXISTS', 'This district already has a head.'];
  }
  return ['DUPLICATE_ENTRY', 'A record with these details already exists.'];
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} was not found.`
    }
  });
};

export const errorHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let code = 'SERVER_ERROR';
  let message = 'An unexpected error occurred. Please try again.';
  let details;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      code = 'FILE_TOO_LARGE';
      message = 'Each file must be 5 MB or smaller.';
    } else if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
      statusCode = 400;
      code = 'TOO_MANY_FILES';
      message = 'You can upload at most 5 files.';
    } else {
      statusCode = 400;
      code = 'UPLOAD_FAILED';
      message = 'The file upload could not be processed.';
    }
  } else if (error?.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    [code, message] = duplicateCode(error.sqlMessage || error.message);
  } else if (error?.code === 'ER_NO_REFERENCED_ROW_2' || error?.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    code = 'INVALID_REFERENCE';
    message = 'A referenced record does not exist.';
  } else if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    code = 'RECORD_IN_USE';
    message = 'This record is still referenced and cannot be removed.';
  } else if (error?.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'The request body is not valid JSON.';
  } else if (error?.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'The request body is too large.';
  } else if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'INVALID_REFRESH_TOKEN';
    message = 'Your session has expired. Please sign in again.';
  } else if (error?.status) {
    statusCode = error.status;
    code = error.code || 'REQUEST_ERROR';
    message = error.message;
  }

  if (statusCode >= 500 && env.nodeEnv !== 'test') {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.nodeEnv === 'development' && statusCode >= 500 ? { stack: error.stack } : {})
    }
  });
};

export default { errorHandler, notFoundHandler };
