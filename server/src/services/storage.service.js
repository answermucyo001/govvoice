import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import env from '../config/env.js';
import { AppError } from '../utils/httpError.js';

const ensureLocalDir = async () => {
  await fs.mkdir(env.storage.localDir, { recursive: true });
};

const safeExtension = (originalName = '') => {
  const ext = path.extname(originalName).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : '';
};

const cloudinaryClient = async () => {
  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config({
    cloud_name: env.storage.cloudinary.cloudName,
    api_key: env.storage.cloudinary.apiKey,
    api_secret: env.storage.cloudinary.apiSecret,
    secure: true
  });
  return cloudinary;
};

export const activeProvider = () => {
  if (env.storage.provider === 'cloudinary') {
    if (!env.storage.cloudinary.cloudName || !env.storage.cloudinary.apiKey) {
      return 'local';
    }
    return 'cloudinary';
  }
  return 'local';
};

export const saveFile = async ({ buffer, originalName, mimeType }) => {
  const provider = activeProvider();

  if (provider === 'cloudinary') {
    const cloudinary = await cloudinaryClient();
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: env.storage.cloudinary.folder,
          resource_type: 'auto',
          public_id: crypto.randomUUID(),
          use_filename: false
        },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded))
      );
      stream.end(buffer);
    });
    return {
      provider: 'cloudinary',
      key: result.public_id,
      url: result.secure_url,
      mimeType
    };
  }

  await ensureLocalDir();
  const key = `${crypto.randomUUID()}${safeExtension(originalName)}`;
  await fs.writeFile(path.join(env.storage.localDir, key), buffer);
  return { provider: 'local', key, url: null, mimeType };
};

export const deleteFile = async ({ provider, key }) => {
  if (!key) return;
  if (provider === 'cloudinary') {
    try {
      const cloudinary = await cloudinaryClient();
      await cloudinary.uploader.destroy(key, { resource_type: 'auto' });
    } catch {
      // best effort
    }
    return;
  }
  try {
    await fs.unlink(path.join(env.storage.localDir, path.basename(key)));
  } catch {
    // best effort
  }
};

export const readFile = async ({ provider, key, url }) => {
  if (provider === 'cloudinary') {
    const response = await fetch(url);
    if (!response.ok) throw new AppError(404, 'NOT_FOUND', 'Attachment file is unavailable.');
    return Buffer.from(await response.arrayBuffer());
  }
  try {
    return await fs.readFile(path.join(env.storage.localDir, path.basename(key)));
  } catch {
    throw new AppError(404, 'NOT_FOUND', 'Attachment file is unavailable.');
  }
};

export default { saveFile, deleteFile, readFile, activeProvider };
