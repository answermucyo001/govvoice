export class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export const badRequest = (message = 'Invalid request.', details) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);

export const unauthorized = (message = 'Authentication required.') =>
  new AppError(401, 'UNAUTHORIZED', message);

export const forbidden = (message = 'You do not have permission to perform this action.') =>
  new AppError(403, 'FORBIDDEN', message);

export const notFound = (message = 'The requested resource was not found.') =>
  new AppError(404, 'NOT_FOUND', message);

export const conflict = (code, message) => new AppError(409, code, message);

export const payloadTooLarge = (message = 'The uploaded file is too large.') =>
  new AppError(413, 'FILE_TOO_LARGE', message);

export const serverError = (message = 'An unexpected error occurred.') =>
  new AppError(500, 'SERVER_ERROR', message);

export const fieldErrors = (details, message = 'Please correct the highlighted fields.') =>
  new AppError(400, 'VALIDATION_ERROR', message, details);

export default {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  payloadTooLarge,
  serverError,
  fieldErrors
};
