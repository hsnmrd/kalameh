import {
  LoginInputSchema,
  createLoginSchema,
  CreateUserSchema,
  UpdateUserSchema,
  ChangePasswordSchema,
  JwtPayloadSchema,
  ROLES,
  PERMISSIONS,
  hasPermission,
} from '@workspace/types';

describe('Auth & User Zod Schemas (@workspace/types)', () => {
  describe('LoginInputSchema', () => {
    it('should validate a correct Iranian mobile number and valid password', () => {
      const validData = {
        phone: '09123456789',
        password: 'password123',
        subdomain: 'tehran',
      };
      const result = LoginInputSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe('09123456789');
        expect(result.data.subdomain).toBe('tehran');
      }
    });

    it('should allow login without subdomain', () => {
      const validData = {
        phone: '09351234567',
        password: 'password123',
      };
      const result = LoginInputSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid phone number formats', () => {
      const invalidPhones = [
        '1234567890',
        '08123456789',
        '0912345678', // 10 digits
        '091234567890', // 12 digits
        'abcdefghijk',
        '',
      ];

      for (const phone of invalidPhones) {
        const result = LoginInputSchema.safeParse({
          phone,
          password: 'password123',
        });
        expect(result.success).toBe(false);
      }
    });

    it('should fail on passwords shorter than 6 characters', () => {
      const result = LoginInputSchema.safeParse({
        phone: '09123456789',
        password: '12345',
      });
      expect(result.success).toBe(false);
    });

    it('should support custom localized error messages via createLoginSchema', () => {
      const localizedSchema = createLoginSchema({
        phoneRegex: 'شماره موبایل نامعتبر است',
        passwordMin: 'رمز عبور حداقل باید ۶ کاراکتر باشد',
      });

      const phoneError = localizedSchema.safeParse({
        phone: 'invalid',
        password: 'validpassword',
      });
      expect(phoneError.success).toBe(false);
      if (!phoneError.success) {
        expect(phoneError.error.issues[0]?.message).toBe(
          'شماره موبایل نامعتبر است',
        );
      }

      const pwdError = localizedSchema.safeParse({
        phone: '09123456789',
        password: '123',
      });
      expect(pwdError.success).toBe(false);
      if (!pwdError.success) {
        expect(pwdError.error.issues[0]?.message).toBe(
          'رمز عبور حداقل باید ۶ کاراکتر باشد',
        );
      }
    });
  });

  describe('CreateUserSchema', () => {
    it('should validate a valid student user creation payload', () => {
      const validUser = {
        firstName: 'Ali',
        lastName: 'Mohammadi',
        phone: '09123456789',
        role: 'STUDENT' as const,
      };
      const result = CreateUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('STUDENT');
      }
    });

    it('should default role to STUDENT if not specified', () => {
      const payload = {
        firstName: 'Sara',
        lastName: 'Ahmadi',
        phone: '09351234567',
      };
      const result = CreateUserSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('STUDENT');
      }
    });

    it('should validate optional fields like nationalCode and UUID course/institute', () => {
      const validUser = {
        firstName: 'Reza',
        lastName: 'Rad',
        phone: '09121112233',
        role: 'CLERK' as const,
        nationalCode: '0012345678',
        currentAllowedCourseId: '550e8400-e29b-41d4-a716-446655440000',
        instituteId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      };
      const result = CreateUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUIDs for course and institute IDs', () => {
      const invalidUser = {
        firstName: 'Reza',
        lastName: 'Rad',
        phone: '09121112233',
        instituteId: 'not-a-uuid',
      };
      const result = CreateUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject names with less than 2 characters', () => {
      const result = CreateUserSchema.safeParse({
        firstName: 'A',
        lastName: 'B',
        phone: '09123456789',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateUserSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        firstName: 'NewName',
        isActive: false,
      };
      const result = UpdateUserSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe('NewName');
        expect(result.data.isActive).toBe(false);
      }
    });

    it('should validate phone formatting if phone is provided', () => {
      const invalidPhoneUpdate = {
        phone: 'invalid-phone',
      };
      const result = UpdateUserSchema.safeParse(invalidPhoneUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('ChangePasswordSchema', () => {
    it('should validate current and new passwords with min length 6', () => {
      const valid = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };
      const result = ChangePasswordSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject new password shorter than 6 chars', () => {
      const invalid = {
        currentPassword: 'oldPassword123',
        newPassword: '123',
      };
      const result = ChangePasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('JwtPayloadSchema', () => {
    it('should validate standard JWT payload', () => {
      const payload = {
        sub: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        phone: '09123456789',
        role: 'INSTITUTE_ADMIN' as const,
        instituteId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      };
      const result = JwtPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject payload missing sub or instituteId', () => {
      const payload = {
        phone: '09123456789',
        role: 'STUDENT',
      };
      const result = JwtPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Role & Permission Helpers', () => {
    it('SUPER_ADMIN should have platform-wide permission check', () => {
      expect(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.MANAGE_USERS)).toBe(
        true,
      );
      expect(
        hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.MANAGE_INSTITUTES),
      ).toBe(true);
      expect(
        hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.MANAGE_TRANSACTIONS),
      ).toBe(true);
    });

    it('INSTITUTE_ADMIN should have expected permissions', () => {
      expect(
        hasPermission(ROLES.INSTITUTE_ADMIN, PERMISSIONS.MANAGE_USERS),
      ).toBe(true);
      expect(
        hasPermission(ROLES.INSTITUTE_ADMIN, PERMISSIONS.MANAGE_CLASSES),
      ).toBe(true);
      expect(
        hasPermission(ROLES.INSTITUTE_ADMIN, PERMISSIONS.MANAGE_INSTITUTES),
      ).toBe(false);
    });

    it('CLERK should have limited permissions', () => {
      expect(hasPermission(ROLES.CLERK, PERMISSIONS.VIEW_USERS)).toBe(true);
      expect(hasPermission(ROLES.CLERK, PERMISSIONS.MANAGE_USERS)).toBe(true);
      expect(hasPermission(ROLES.CLERK, PERMISSIONS.MANAGE_INSTITUTES)).toBe(
        false,
      );
    });

    it('STUDENT should have view and enroll permissions only', () => {
      expect(hasPermission(ROLES.STUDENT, PERMISSIONS.ENROLL_COURSE)).toBe(
        true,
      );
      expect(hasPermission(ROLES.STUDENT, PERMISSIONS.VIEW_CLASSES)).toBe(true);
      expect(hasPermission(ROLES.STUDENT, PERMISSIONS.MANAGE_USERS)).toBe(
        false,
      );
      expect(hasPermission(ROLES.STUDENT, PERMISSIONS.MANAGE_COURSES)).toBe(
        false,
      );
    });
  });
});
