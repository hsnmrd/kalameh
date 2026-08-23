import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { diskStorage, type Options } from 'multer';

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
];

export interface MulterConfigOptions {
  destination: string;
  allowedMimeTypes?: string[];
  maxFileSize?: number;
}

export function createMulterOptions(config: MulterConfigOptions): Options {
  const {
    destination,
    allowedMimeTypes = IMAGE_MIME_TYPES,
    maxFileSize = 5 * 1024 * 1024,
  } = config;

  const storage = diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = path.resolve(process.cwd(), 'uploads', destination);
      try {
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      } catch (err) {
        cb(err as Error, uploadDir);
      }
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const filename = `${randomUUID()}${ext}`;
      cb(null, filename);
    },
  });

  return {
    storage,
    limits: {
      fileSize: maxFileSize,
    },
    fileFilter: (_req, file, cb) => {
      if (allowedMimeTypes && allowedMimeTypes.length > 0) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`,
            ),
          );
        }
      }
      cb(null, true);
    },
  };
}

export const instituteLogoMulterOptions = createMulterOptions({
  destination: 'institutes',
  allowedMimeTypes: IMAGE_MIME_TYPES,
  maxFileSize: 5 * 1024 * 1024,
});

export const imageUploadOptions = (
  destination: string,
  maxFileSize = 5 * 1024 * 1024,
) =>
  createMulterOptions({
    destination,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxFileSize,
  });
