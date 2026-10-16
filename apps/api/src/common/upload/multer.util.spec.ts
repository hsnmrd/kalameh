/* eslint-disable @typescript-eslint/unbound-method */
import fs from 'node:fs';
import path from 'node:path';
import { BadRequestException } from '@nestjs/common';
import {
  createMulterOptions,
  getFallbackUploadsRoot,
  instituteLogoMulterOptions,
  imageUploadOptions,
  IMAGE_MIME_TYPES,
  resolveUploadDir,
  resolveUploadedFileUrl,
} from './multer.util';

describe('Multer Utilities', () => {
  afterEach(() => {
    delete process.env.VERCEL;
    jest.restoreAllMocks();
  });

  describe('createMulterOptions', () => {
    it('should configure disk storage, limits, and fileFilter properly', () => {
      const options = createMulterOptions({
        destination: 'test-folder',
        maxFileSize: 2 * 1024 * 1024,
      });

      expect(options.storage).toBeDefined();
      expect(options.limits).toEqual({ fileSize: 2 * 1024 * 1024 });
      expect(typeof options.fileFilter).toBe('function');
    });

    it('should allow valid image mime types in fileFilter', (done) => {
      const options = createMulterOptions({
        destination: 'test-folder',
        allowedMimeTypes: IMAGE_MIME_TYPES,
      });

      const fileFilter = options.fileFilter as (
        req: any,
        file: any,
        cb: (err: any, accept: boolean) => void,
      ) => void;

      fileFilter({} as any, { mimetype: 'image/png' } as any, (err, accept) => {
        expect(err).toBeNull();
        expect(accept).toBe(true);
        done();
      });
    });

    it('should reject disallowed mime types with BadRequestException', (done) => {
      const options = createMulterOptions({
        destination: 'test-folder',
        allowedMimeTypes: ['image/png', 'image/jpeg'],
      });

      const fileFilter = options.fileFilter as (
        req: any,
        file: any,
        cb: (err: any, accept: boolean) => void,
      ) => void;

      fileFilter(
        {} as any,
        { mimetype: 'application/pdf' } as any,
        (err, accept) => {
          expect(err).toBeInstanceOf(BadRequestException);
          expect(accept).toBeFalsy();
          done();
        },
      );
    });
  });

  describe('resolveUploadDir & resolveUploadedFileUrl', () => {
    it('falls back to os.tmpdir() when VERCEL env is set or primary directory is read-only', () => {
      process.env.VERCEL = '1';
      const resolved = resolveUploadDir('transactions');
      expect(resolved).toBe(
        path.resolve(getFallbackUploadsRoot(), 'transactions'),
      );
      expect(fs.existsSync(resolved)).toBe(true);
    });

    it('returns /uploads/<destination>/<filename> for standard local disk storage', () => {
      const file = {
        filename: 'receipt-123.jpg',
        destination: path.resolve(process.cwd(), 'uploads', 'transactions'),
      } as Express.Multer.File;

      expect(resolveUploadedFileUrl(file, 'transactions')).toBe(
        '/uploads/transactions/receipt-123.jpg',
      );
    });

    it('returns base64 data URI when stored in fallback tmp directory on serverless', () => {
      const fallbackDir = resolveUploadDir('transactions');
      const tempFilePath = path.join(fallbackDir, 'serverless-receipt.jpg');
      fs.writeFileSync(tempFilePath, Buffer.from('fake-jpeg-bytes'));

      const file = {
        filename: 'serverless-receipt.jpg',
        mimetype: 'image/jpeg',
        destination: path.resolve(getFallbackUploadsRoot(), 'transactions'),
        path: tempFilePath,
      } as Express.Multer.File;

      const url = resolveUploadedFileUrl(file, 'transactions');
      expect(url).toBe(
        `data:image/jpeg;base64,${Buffer.from('fake-jpeg-bytes').toString('base64')}`,
      );

      fs.rmSync(tempFilePath, { force: true });
    });
  });

  describe('Presets', () => {
    it('should have instituteLogoMulterOptions configured for institutes folder', () => {
      expect(instituteLogoMulterOptions).toBeDefined();
      expect(instituteLogoMulterOptions.limits).toEqual({
        fileSize: 5 * 1024 * 1024,
      });
    });

    it('should create custom image upload options with imageUploadOptions', () => {
      const options = imageUploadOptions('avatars', 10 * 1024 * 1024);
      expect(options.limits).toEqual({ fileSize: 10 * 1024 * 1024 });
    });
  });
});
