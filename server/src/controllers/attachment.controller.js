import { execute, queryOne } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, forbidden, notFound } from '../utils/httpError.js';
import { isUuid } from '../utils/validation.js';
import { saveFile, deleteFile, readFile } from '../services/storage.service.js';
import { sniffAllowed } from '../middleware/upload.js';
import { logAction } from '../services/audit.service.js';

const mapAttachment = (row) => ({
  id: row.id,
  originalName: row.original_name,
  mimeType: row.mime_type,
  sizeBytes: Number(row.size_bytes),
  kind: row.file_kind,
  submissionId: row.submission_id,
  createdAt: row.created_at
});

const safeName = (name = 'attachment') =>
  String(name)
    .replace(/[\\/:*?"<>|\r\n]/g, '_')
    .slice(0, 180) || 'attachment';

export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw badRequest('Select a file to upload.');

  const allowed = await sniffAllowed(req.file.buffer);
  if (!allowed) {
    throw badRequest('Only JPG, PNG, WEBP and PDF files are allowed.');
  }

  const stored = await saveFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype
  });

  const kind = req.file.mimetype.startsWith('image/') ? 'image' : 'document';

  await execute(
    `INSERT INTO attachments
       (id, submission_id, uploaded_by, original_name, storage_provider, storage_key, url,
        mime_type, size_bytes, file_kind, visibility)
     VALUES (UUID(), NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'private')`,
    [
      req.user.id,
      safeName(req.file.originalname),
      stored.provider,
      stored.key,
      stored.url,
      req.file.mimetype,
      req.file.size,
      kind
    ]
  );

  const row = await queryOne(
    `SELECT id, original_name, mime_type, size_bytes, file_kind, submission_id, created_at
       FROM attachments
      WHERE uploaded_by = ?
      ORDER BY created_at DESC
      LIMIT 1`,
    [req.user.id]
  );

  await logAction({
    userId: req.user.id,
    action: 'attachment.upload',
    entityType: 'attachment',
    entityId: row.id,
    newValue: { originalName: row.original_name, sizeBytes: row.size_bytes },
    ipAddress: req.ip
  });

  res.status(201).json({ data: { attachment: mapAttachment(row) } });
});

export const deleteAttachment = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('Attachment not found.');
  const row = await queryOne('SELECT * FROM attachments WHERE id = ? LIMIT 1', [req.params.id]);
  if (!row) throw notFound('Attachment not found.');

  const isOwner = row.uploaded_by === req.user.id;
  const isAdmin = req.user.role === 'super_admin';
  if (!isOwner && !isAdmin) {
    throw forbidden('You cannot remove this attachment.');
  }
  if (row.submission_id && !isAdmin) {
    throw forbidden('Attachments linked to a submission cannot be removed.');
  }

  await execute('DELETE FROM attachments WHERE id = ?', [row.id]);
  await deleteFile({ provider: row.storage_provider, key: row.storage_key });

  await logAction({
    userId: req.user.id,
    action: 'attachment.delete',
    entityType: 'attachment',
    entityId: row.id,
    ipAddress: req.ip
  });

  res.json({ data: { message: 'Attachment removed.' } });
});

export const downloadAttachment = asyncHandler(async (req, res) => {
  if (!isUuid(req.params.id)) throw notFound('Attachment not found.');
  const row = await queryOne(
    `SELECT a.*, s.visibility AS submission_visibility, s.submitted_by AS submission_owner
       FROM attachments a
       LEFT JOIN submissions s ON s.id = a.submission_id
      WHERE a.id = ?
      LIMIT 1`,
    [req.params.id]
  );
  if (!row) throw notFound('Attachment not found.');

  const isOwner = row.uploaded_by === req.user.id || row.submission_owner === req.user.id;
  const isOfficial = ['district_head', 'sector_head', 'super_admin'].includes(req.user.role);
  const isPublicFile =
    row.submission_id && row.submission_visibility === 'public' && row.visibility === 'public';

  if (!isOwner && !isOfficial && !isPublicFile) {
    throw forbidden('You cannot download this attachment.');
  }

  const buffer = await readFile({
    provider: row.storage_provider,
    key: row.storage_key,
    url: row.url
  });

  const filename = safeName(row.original_name);
  res.setHeader('Content-Type', row.mime_type || 'application/octet-stream');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(filename)}`
  );
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  res.send(buffer);
});

export default { uploadAttachment, deleteAttachment, downloadAttachment };
