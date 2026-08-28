/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ExcelService } from '../common/excel/excel.service';
import { JwtPayload, STAFF_ROLES } from '@workspace/types';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: any;
  let i18nService: any;
  let excelService: any;

  const mockSuperAdmin: JwtPayload = {
    sub: 'super-admin-id',
    phone: '09120000000',
    role: 'SUPER_ADMIN',
    instituteId: 'inst-super-id',
  };

  const mockInstituteAdmin: JwtPayload = {
    sub: 'admin-id',
    phone: '09121111111',
    role: 'ADMIN',
    instituteId: 'inst-1',
  };

  const mockClerk: JwtPayload = {
    sub: 'clerk-id',
    phone: '09122222222',
    role: 'CLERK',
    instituteId: 'inst-1',
  };

  const mockStudent: JwtPayload = {
    sub: 'student-id',
    phone: '09123333333',
    role: 'STUDENT',
    instituteId: 'inst-1',
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
        delete: jest.fn(),
      },
      branch: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'branch-1', name: 'شعبه مرکزی' }]),
      },
      enrollment: {
        count: jest.fn().mockResolvedValue(0),
      },
      transaction: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    i18nService = {
      t: jest.fn((key: string) => key),
      extractLocale: jest.fn().mockReturnValue('fa'),
    };

    excelService = {
      generateUserTemplate: jest
        .fn()
        .mockReturnValue(Buffer.from('mock-xlsx-template')),
      parseUserRows: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaService },
        { provide: I18nService, useValue: i18nService },
        { provide: ExcelService, useValue: excelService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a student by ADMIN', async () => {
      const dto = {
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09129876543',
        role: 'STUDENT' as const,
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockImplementation(({ data }: any) => ({
        id: 'created-user-id',
        ...data,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await service.create(mockInstituteAdmin, dto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          phone_instituteId: {
            phone: dto.phone,
            instituteId: 'inst-1',
          },
        },
      });

      expect(prismaService.user.create).toHaveBeenCalled();
      expect(result.id).toBe('created-user-id');
      expect(result.role).toBe('STUDENT');
      expect(result.instituteId).toBe('inst-1');
    });

    it('should allow SUPER_ADMIN to create an ADMIN in target institute', async () => {
      const dto = {
        firstName: 'New',
        lastName: 'Manager',
        phone: '09121234567',
        role: 'ADMIN' as const,
        instituteId: 'target-inst-id',
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockImplementation(({ data }: any) => ({
        id: 'new-manager-id',
        ...data,
      }));

      const result = await service.create(mockSuperAdmin, dto);
      expect(result.instituteId).toBe('target-inst-id');
      expect(result.role).toBe('ADMIN');
    });

    it('should throw ForbiddenException if ADMIN tries to create SUPER_ADMIN', async () => {
      const dto = {
        firstName: 'Bad',
        lastName: 'Admin',
        phone: '09129876543',
        role: 'SUPER_ADMIN' as const,
      };

      await expect(service.create(mockInstituteAdmin, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if CLERK tries to create non-student', async () => {
      const dto = {
        firstName: 'Bad',
        lastName: 'Clerk',
        phone: '09129876543',
        role: 'CLERK' as const,
      };

      await expect(service.create(mockClerk, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if STUDENT tries to create any user', async () => {
      const dto = {
        firstName: 'Any',
        lastName: 'User',
        phone: '09129876543',
        role: 'STUDENT' as const,
      };

      await expect(service.create(mockStudent, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if phone already exists in the same institute', async () => {
      const dto = {
        firstName: 'Duplicate',
        lastName: 'User',
        phone: '09129876543',
        role: 'STUDENT' as const,
      };

      prismaService.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(mockInstituteAdmin, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should default password to phone number if password is not provided', async () => {
      const dto = {
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09129876543',
        role: 'STUDENT' as const,
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockImplementation(({ data }: any) => ({
        id: 'created-id',
        ...data,
      }));

      await service.create(mockInstituteAdmin, dto);

      const createCall = prismaService.user.create.mock.calls[0][0];
      const isValidDefaultPassword = await bcrypt.compare(
        dto.phone,
        createCall.data.password,
      );
      expect(isValidDefaultPassword).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should filter users by target instituteId', async () => {
      const mockUsers = [
        { id: 'u1', firstName: 'Ali', lastName: 'A', role: 'TEACHER' },
      ];
      prismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll(mockInstituteAdmin);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            instituteId: 'inst-1',
            role: { in: STAFF_ROLES },
          }),
        }),
      );
      expect(result).toEqual(mockUsers);
    });

    it('should return empty list if ADMIN requests student or super admin role', async () => {
      const resultStudent = await service.findAll(
        mockInstituteAdmin,
        'STUDENT',
      );
      expect(resultStudent).toEqual([]);

      const resultSuper = await service.findAll(
        mockInstituteAdmin,
        'SUPER_ADMIN',
      );
      expect(resultSuper).toEqual([]);
    });

    it('should throw ForbiddenException for STUDENT attempting to list users', async () => {
      await expect(service.findAll(mockStudent)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should find user belonging to the institute', async () => {
      const targetUser = {
        id: 'user-1',
        instituteId: 'inst-1',
        role: 'STUDENT',
        firstName: 'Sara',
      };
      prismaService.user.findFirstOrThrow.mockResolvedValue(targetUser);

      const result = await service.findOne(mockInstituteAdmin, 'user-1');

      expect(prismaService.user.findFirstOrThrow).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
          instituteId: 'inst-1',
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(targetUser);
    });

    it('should throw ForbiddenException if non-super-admin accesses SUPER_ADMIN user', async () => {
      const targetSuperAdmin = {
        id: 'super-1',
        instituteId: 'inst-1',
        role: 'SUPER_ADMIN',
      };
      prismaService.user.findFirstOrThrow.mockResolvedValue(targetSuperAdmin);

      await expect(
        service.findOne(mockInstituteAdmin, 'super-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update user fields successfully', async () => {
      const targetUser = {
        id: 'user-1',
        instituteId: 'inst-1',
        role: 'STUDENT',
        phone: '09121111111',
      };
      prismaService.user.findFirstOrThrow.mockResolvedValue(targetUser);
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.update.mockResolvedValue({
        ...targetUser,
        firstName: 'UpdatedName',
      });

      const result = await service.update(mockInstituteAdmin, 'user-1', {
        firstName: 'UpdatedName',
      });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { firstName: 'UpdatedName' },
        select: expect.any(Object),
      });
      expect(result.firstName).toBe('UpdatedName');
    });

    it('should throw ConflictException if new phone is already taken in institute', async () => {
      const targetUser = {
        id: 'user-1',
        instituteId: 'inst-1',
        role: 'STUDENT',
        phone: '09121111111',
      };
      prismaService.user.findFirstOrThrow.mockResolvedValue(targetUser);
      prismaService.user.findFirst.mockResolvedValue({ id: 'user-2' });

      await expect(
        service.update(mockInstituteAdmin, 'user-1', { phone: '09122222222' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('resetPassword', () => {
    it('should reset user password successfully', async () => {
      const targetUser = {
        id: 'user-1',
        instituteId: 'inst-1',
        role: 'STUDENT',
        phone: '09129876543',
      };
      prismaService.user.findFirstOrThrow.mockResolvedValue(targetUser);
      prismaService.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.resetPassword(
        mockInstituteAdmin,
        'user-1',
        'newPassword123',
      );

      expect(prismaService.user.update).toHaveBeenCalled();
      const updateCall = prismaService.user.update.mock.calls[0][0];
      const isMatch = await bcrypt.compare(
        'newPassword123',
        updateCall.data.password,
      );
      expect(isMatch).toBe(true);
      expect(result).toHaveProperty('message');
    });

    it('should throw ForbiddenException if CLERK tries to reset password of non-student', async () => {
      const targetAdmin = {
        id: 'admin-2',
        instituteId: 'inst-1',
        role: 'ADMIN',
      };
      prismaService.user.findFirstOrThrow.mockResolvedValue(targetAdmin);

      await expect(
        service.resetPassword(mockClerk, 'admin-2', 'password'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('generateExcelTemplate', () => {
    it('should delegate to excelService.generateUserTemplate', () => {
      const result = service.generateExcelTemplate('fa');
      expect(excelService.generateUserTemplate).toHaveBeenCalledWith('fa');
      expect(result).toEqual(Buffer.from('mock-xlsx-template'));
    });
  });

  describe('importFromExcel', () => {
    it('should successfully parse and import valid user rows', async () => {
      const mockRows = [
        {
          firstName: 'سارا',
          lastName: 'کریمی',
          phone: '09121112233',
          nationalCode: '0012345678',
          role: 'TEACHER',
          branchName: 'شعبه مرکزی',
        },
      ];
      excelService.parseUserRows.mockReturnValue(mockRows);
      prismaService.user.findMany.mockResolvedValue([]); // No existing phones

      const result = await service.importFromExcel(
        mockInstituteAdmin,
        Buffer.from('fake-buffer'),
        'fa',
      );

      expect(result.totalRows).toBe(1);
      expect(result.importedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect(prismaService.user.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            instituteId: 'inst-1',
            branchId: 'branch-1',
            firstName: 'سارا',
            lastName: 'کریمی',
            phone: '09121112233',
            role: 'TEACHER',
          }),
        ],
      });
    });

    it('should report row-level errors for invalid phones and duplicate entries', async () => {
      const mockRows = [
        {
          firstName: 'نام نامعتبر',
          lastName: 'تست',
          phone: '12345', // Invalid phone
          role: 'TEACHER',
        },
        {
          firstName: 'کاربر',
          lastName: 'موجود',
          phone: '09129999999',
          role: 'TEACHER',
        },
      ];
      excelService.parseUserRows.mockReturnValue(mockRows);
      prismaService.user.findMany.mockResolvedValue([{ phone: '09129999999' }]); // Existing phone

      const result = await service.importFromExcel(
        mockInstituteAdmin,
        Buffer.from('fake-buffer'),
        'fa',
      );

      expect(result.totalRows).toBe(2);
      expect(result.importedCount).toBe(0);
      expect(result.failedCount).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[1].row).toBe(3);
    });

    it('should throw ForbiddenException if CLERK attempts to bulk import users', async () => {
      await expect(
        service.importFromExcel(mockClerk, Buffer.from('fake-buffer'), 'fa'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should delete a user successfully by ADMIN', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-to-delete',
        instituteId: 'inst-1',
        role: 'TEACHER',
      });
      prismaService.enrollment.count.mockResolvedValue(0);
      prismaService.transaction.count.mockResolvedValue(0);
      prismaService.user.delete.mockResolvedValue({ id: 'user-to-delete' });

      const result = await service.delete(mockInstituteAdmin, 'user-to-delete');
      expect(result.message).toBeDefined();
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-to-delete' },
      });
    });

    it('should throw BadRequestException if user tries to delete their own account', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'admin-id',
        instituteId: 'inst-1',
        role: 'ADMIN',
      });

      await expect(
        service.delete(mockInstituteAdmin, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if trying to delete SUPER_ADMIN', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'super-admin-id',
        instituteId: 'inst-1',
        role: 'SUPER_ADMIN',
      });

      await expect(
        service.delete(mockInstituteAdmin, 'super-admin-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if user has dependent enrollments or transactions', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'student-with-data',
        instituteId: 'inst-1',
        role: 'STUDENT',
      });
      prismaService.enrollment.count.mockResolvedValue(2);
      prismaService.transaction.count.mockResolvedValue(0);

      await expect(
        service.delete(mockInstituteAdmin, 'student-with-data'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('lookup', () => {
    it('should return found=false when nationalCode and phone are empty', async () => {
      const result = await service.lookup(mockInstituteAdmin, '', '');
      expect(result).toEqual({ found: false, user: null });
      expect(prismaService.user.findMany).not.toHaveBeenCalled();
    });

    it('should return found=true with user details when matched by phone', async () => {
      prismaService.user.findMany.mockResolvedValue([
        {
          id: 'u-1',
          instituteId: 'inst-1',
          firstName: 'Sara',
          lastName: 'Rad',
          phone: '09121112233',
          nationalCode: '0012345678',
          role: 'TEACHER',
          studentProfile: {
            fatherName: 'Ali',
            birthDate: new Date('1995-05-05'),
            gender: 'FEMALE',
            emergencyPhone: '09129998877',
            address: 'Tehran',
          },
        },
      ]);

      const result = await service.lookup(
        mockInstituteAdmin,
        undefined,
        '09121112233',
      );
      expect(result.found).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.firstName).toBe('Sara');
      expect(result.user?.role).toBe('TEACHER');
    });

    it('should return found=false when no user matches query', async () => {
      prismaService.user.findMany.mockResolvedValue([]);

      const result = await service.lookup(mockInstituteAdmin, '0000000000');
      expect(result.found).toBe(false);
      expect(result.user).toBeNull();
    });
  });
});
