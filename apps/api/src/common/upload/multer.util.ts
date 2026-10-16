import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
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

export function getFallbackUploadsRoot(): string {
  return path.resolve(os.tmpdir(), 'kalameh-uploads');
}

export function resolveUploadDir(destination: string): string {
  const primaryDir = path.resolve(process.cwd(), 'uploads', destination);
  if (!process.env.VERCEL) {
    try {
      if (!fs.existsSync(primaryDir)) {
        fs.mkdirSync(primaryDir, { recursive: true });
      }
      fs.accessSync(primaryDir, fs.constants.W_OK);
      return primaryDir;
    } catch {
      // Fall back to os.tmpdir() when the primary uploads directory is on a read-only filesystem
    }
  }

  const fallbackDir = path.resolve(getFallbackUploadsRoot(), destination);
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return fallbackDir;
}

export function resolveUploadedFileUrl(
  file: Express.Multer.File,
  destination: string,
): string {
  const fallbackRoot = getFallbackUploadsRoot();
  const isFallbackTmpStorage =
    Boolean(process.env.VERCEL) ||
    Boolean(file.destination && file.destination.startsWith(fallbackRoot));

  if (isFallbackTmpStorage && file.path && fs.existsSync(file.path)) {
    try {
      const buffer = fs.readFileSync(file.path);
      if (buffer.byteLength > 0) {
        const mimeType = file.mimetype || 'image/png';
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
    } catch {
      // Fall back to static upload URL if reading temporary file fails
    }
  }

  return `/uploads/${destination}/${file.filename}`;
}

export function createMulterOptions(config: MulterConfigOptions): Options {
  const {
    destination,
    allowedMimeTypes = IMAGE_MIME_TYPES,
    maxFileSize = 5 * 1024 * 1024,
  } = config;

  const storage = diskStorage({
    destination: (_req, _file, cb) => {
      try {
        const uploadDir = resolveUploadDir(destination);
        cb(null, uploadDir);
      } catch (err) {
        cb(err as Error, path.resolve(getFallbackUploadsRoot(), destination));
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
