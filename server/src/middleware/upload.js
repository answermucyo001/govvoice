import multer from 'multer';
import env from '../config/env.js';
import { AppError } from '../utils/httpError.js';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]);

const storage = multer.memoryStorage();

const fileFilter = (_req, file, callback) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    callback(
      new AppError(400, 'FILE_TYPE_INVALID', 'Only JPG, PNG, WEBP and PDF files are allowed.')
    );
    return;
  }
  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.storage.maxFileSize,
    files: env.storage.maxFiles
  }
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', env.storage.maxFiles);

export const sniffAllowed = async (buffer) => {
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) return false;
  return ALLOWED_MIME.has(detected.mime);
};

export default { upload, uploadSingle, uploadMultiple, sniffAllowed };
