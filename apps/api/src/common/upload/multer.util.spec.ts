/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import {
  createMulterOptions,
  instituteLogoMulterOptions,
  imageUploadOptions,
  IMAGE_MIME_TYPES,
} from './multer.util';

describe('Multer Utilities', () => {
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
