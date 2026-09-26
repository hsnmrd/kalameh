/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { TeacherAvailabilityService } from './teacher-availability.service';
import { TeacherQualificationsService } from './teacher-qualifications.service';
import { TeacherCreateService } from './teacher-create.service';
import { TeacherLifecycleService } from './teacher-lifecycle.service';
import { TeacherQueryService } from './teacher-query.service';
import { TeacherUpdateService } from './teacher-update.service';
import {
  CreateTeacherSchema,
  ROLES,
  UpdateTeacherSchema,
  type JwtPayload,
} from '@workspace/types';

describe('Teacher course qualification DTO parsing', () => {
  const courseId = '11111111-1111-4111-8111-111111111111';

  it('parses JSON course IDs received through multipart form data', () => {
    const parsed = CreateTeacherSchema.parse({
      firstName: 'Ali',
      lastName: 'Rezaei',
      phone: '09123456789',
      courseIds: JSON.stringify([courseId, courseId]),
    });

    expect(parsed.courseIds).toEqual([courseId]);
  });

  it('parses an empty multipart value as an explicit clear operation', () => {
    expect(UpdateTeacherSchema.parse({ courseIds: '' }).courseIds).toEqual([]);
  });
});

describe('TeachersService', () => {
  let service: TeachersService;
  let prisma: any;
  let i18nService: any;
  let auditLogsService: any;

  const mockAdmin: JwtPayload = {
    sub: 'admin-id',
    phone: '09121111111',
    role: 'ADMIN',
    instituteId: 'inst-1',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      teacherProfile: {
        create: jest.fn(),
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      teacherAvailability: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      teacherCourseQualification: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      course: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    i18nService = {
      t: jest.fn((key: string) => key),
    };

    auditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        TeacherAvailabilityService,
        TeacherQualificationsService,
        TeacherCreateService,
        TeacherLifecycleService,
        TeacherQueryService,
        TeacherUpdateService,
        { provide: PrismaService, useValue: prisma },
        { provide: I18nService, useValue: i18nService },
        { provide: AuditLogsService, useValue: auditLogsService },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create teacher with profile and free time availability', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'teacher-1',
        instituteId: 'inst-1',
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09123456789',
        password: 'hashed-password',
        role: ROLES.TEACHER,
        nationalCode: '0011223344',
        avatarUrl: null,
        isActive: true,
        teacherProfile: {
          id: 'tp-1',
          userId: 'teacher-1',
          bio: 'Math professor',
          degree: 'PhD',
          availabilities: [
            {
              id: 'avail-1',
              teacherProfileId: 'tp-1',
              dayOfWeek: 'SATURDAY',
              startTime: '10:00',
              endTime: '14:00',
            },
          ],
        },
      });

      const result = await service.create(mockAdmin, {
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09123456789',
        nationalCode: '0011223344',
        bio: 'Math professor',
        degree: 'PhD',
        courseIds: [],
        availabilities: [
          {
            dayOfWeek: 'SATURDAY',
            startTime: '10:00',
            endTime: '14:00',
          },
        ],
      });

      expect(result.id).toBe('teacher-1');
      expect(result.role).toBe(ROLES.TEACHER);
      expect(result.teacherProfile?.availabilities).toHaveLength(1);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: ROLES.TEACHER,
            phone: '09123456789',
          }),
        }),
      );
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TEACHER_CREATED',
        }),
      );
    });

    it('should throw ConflictException if phone already exists in institute', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.create(mockAdmin, {
          firstName: 'Ali',
          lastName: 'Rezaei',
          phone: '09123456789',
          courseIds: [],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create tenant-scoped course qualifications', async () => {
      const courseId = '11111111-1111-4111-8111-111111111111';
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.course.findMany.mockResolvedValue([{ id: courseId }]);
      prisma.user.create.mockResolvedValue({
        id: 'teacher-1',
        instituteId: 'inst-1',
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09123456789',
        password: 'hashed-password',
        teacherProfile: { teachableCourses: [] },
      });

      await service.create(mockAdmin, {
        firstName: 'Ali',
        lastName: 'Rezaei',
        phone: '09123456789',
        courseIds: [courseId],
      });

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: { instituteId: 'inst-1', id: { in: [courseId] } },
        select: { id: true },
      });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teacherProfile: expect.objectContaining({
              create: expect.objectContaining({
                teachableCourses: {
                  create: [{ instituteId: 'inst-1', courseId }],
                },
              }),
            }),
          }),
        }),
      );
    });

    it('should reject a course outside the teacher institute', async () => {
      const courseId = '11111111-1111-4111-8111-111111111111';
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.course.findMany.mockResolvedValue([]);

      await expect(
        service.create(mockAdmin, {
          firstName: 'Ali',
          lastName: 'Rezaei',
          phone: '09123456789',
          courseIds: [courseId],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return list of teachers filtered by instituteId', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'teacher-1',
          instituteId: 'inst-1',
          firstName: 'Ali',
          lastName: 'Rezaei',
          phone: '09123456789',
          role: ROLES.TEACHER,
          isActive: true,
          teacherProfile: {
            availabilities: [],
          },
          _count: { teachingClasses: 3 },
        },
      ]);

      const result = await service.findAll(mockAdmin, {});
      expect(result).toHaveLength(1);
      expect(result[0].classesCount).toBe(3);
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            instituteId: 'inst-1',
            role: ROLES.TEACHER,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return teacher details with profile and classes', async () => {
      prisma.user.findFirstOrThrow.mockResolvedValue({
        id: 'teacher-1',
        instituteId: 'inst-1',
        firstName: 'Ali',
        lastName: 'Rezaei',
        role: ROLES.TEACHER,
        teacherProfile: {
          availabilities: [],
        },
        teachingClasses: [],
        _count: { teachingClasses: 0 },
      });

      const result = await service.findOne(mockAdmin, 'teacher-1');
      expect(result.id).toBe('teacher-1');
      expect(result.classesCount).toBe(0);
    });
  });

  describe('update', () => {
    const existingTeacher = {
      id: 'teacher-1',
      instituteId: 'inst-1',
      firstName: 'Ali',
      lastName: 'Rezaei',
      phone: '09123456789',
      avatarUrl: null,
      teacherProfile: { id: 'profile-1', availabilities: [] },
    };

    it('should update the user, profile, and availabilities in one transaction', async () => {
      prisma.user.findFirstOrThrow.mockResolvedValue(existingTeacher);
      prisma.teacherProfile.upsert.mockResolvedValue({ id: 'profile-1' });
      prisma.teacherAvailability.deleteMany.mockResolvedValue({ count: 1 });
      prisma.teacherAvailability.createMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({
        ...existingTeacher,
        password: 'hashed-password',
      });

      await service.update(mockAdmin, 'teacher-1', {
        firstName: 'Updated',
        degree: 'PhD',
        availabilities: [
          {
            dayOfWeek: 'SATURDAY',
            startTime: '10:00',
            endTime: '12:00',
          },
        ],
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.teacherProfile.upsert).toHaveBeenCalled();
      expect(prisma.teacherAvailability.deleteMany).toHaveBeenCalledWith({
        where: { teacherProfileId: 'profile-1' },
      });
      expect(prisma.teacherAvailability.createMany).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'teacher-1', instituteId: 'inst-1' },
        }),
      );
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TEACHER_UPDATED' }),
      );
    });

    it('should not write an audit log when the transaction fails', async () => {
      prisma.user.findFirstOrThrow.mockResolvedValue(existingTeacher);
      prisma.teacherProfile.upsert.mockResolvedValue({ id: 'profile-1' });
      prisma.user.update.mockRejectedValue(new Error('database failure'));

      await expect(
        service.update(mockAdmin, 'teacher-1', { degree: 'PhD' }),
      ).rejects.toThrow('database failure');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });

    it('should replace course qualifications in the same transaction', async () => {
      const courseId = '11111111-1111-4111-8111-111111111111';
      prisma.user.findFirstOrThrow.mockResolvedValue(existingTeacher);
      prisma.course.findMany.mockResolvedValue([{ id: courseId }]);
      prisma.teacherProfile.upsert.mockResolvedValue({ id: 'profile-1' });
      prisma.teacherCourseQualification.deleteMany.mockResolvedValue({
        count: 1,
      });
      prisma.teacherCourseQualification.createMany.mockResolvedValue({
        count: 1,
      });
      prisma.user.update.mockResolvedValue({
        ...existingTeacher,
        password: 'hashed-password',
      });

      await service.update(mockAdmin, 'teacher-1', {
        courseIds: [courseId],
      });

      expect(prisma.teacherCourseQualification.deleteMany).toHaveBeenCalledWith(
        { where: { teacherProfileId: 'profile-1' } },
      );
      expect(prisma.teacherCourseQualification.createMany).toHaveBeenCalledWith(
        {
          data: [
            {
              instituteId: 'inst-1',
              teacherProfileId: 'profile-1',
              courseId,
            },
          ],
        },
      );
    });

    it('should clear every course qualification when courseIds is empty', async () => {
      prisma.user.findFirstOrThrow.mockResolvedValue(existingTeacher);
      prisma.teacherProfile.upsert.mockResolvedValue({ id: 'profile-1' });
      prisma.teacherCourseQualification.deleteMany.mockResolvedValue({
        count: 2,
      });
      prisma.user.update.mockResolvedValue({
        ...existingTeacher,
        password: 'hashed-password',
      });

      await service.update(mockAdmin, 'teacher-1', { courseIds: [] });

      expect(prisma.teacherCourseQualification.deleteMany).toHaveBeenCalled();
      expect(
        prisma.teacherCourseQualification.createMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('replaceAvailabilities', () => {
    const existingTeacher = {
      id: 'teacher-1',
      instituteId: 'inst-1',
      firstName: 'Ali',
      lastName: 'Rezaei',
      phone: '09123456789',
      avatarUrl: null,
      teacherProfile: { id: 'profile-1', availabilities: [] },
    };

    it('should replace weekly availability slots in a transaction and log audit', async () => {
      prisma.user.findFirstOrThrow.mockResolvedValue(existingTeacher);
      prisma.teacherAvailability.deleteMany.mockResolvedValue({ count: 1 });
      prisma.teacherAvailability.createMany.mockResolvedValue({ count: 2 });
      prisma.teacherAvailability.findMany.mockResolvedValue([
        {
          id: 'avail-1',
          teacherProfileId: 'profile-1',
          dayOfWeek: 'SATURDAY',
          startTime: '08:00',
          endTime: '10:00',
        },
        {
          id: 'avail-2',
          teacherProfileId: 'profile-1',
          dayOfWeek: 'MONDAY',
          startTime: '08:00',
          endTime: '10:00',
        },
      ]);

      const result = await service.replaceAvailabilities(
        mockAdmin,
        'teacher-1',
        {
          availabilities: [
            { dayOfWeek: 'SATURDAY', startTime: '08:00', endTime: '10:00' },
            { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '10:00' },
          ],
        },
      );

      expect(prisma.teacherAvailability.deleteMany).toHaveBeenCalledWith({
        where: { teacherProfileId: 'profile-1' },
      });
      expect(prisma.teacherAvailability.createMany).toHaveBeenCalledWith({
        data: [
          {
            teacherProfileId: 'profile-1',
            dayOfWeek: 'SATURDAY',
            startTime: '08:00',
            endTime: '10:00',
          },
          {
            teacherProfileId: 'profile-1',
            dayOfWeek: 'MONDAY',
            startTime: '08:00',
            endTime: '10:00',
          },
        ],
      });
      expect(result).toHaveLength(2);
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TEACHER_AVAILABILITY_UPDATED',
          metadata: { count: 2 },
        }),
      );
    });
  });

  describe('resetPassword', () => {
    it('should hash new password and update user', async () => {
      prisma.user.findFirstOrThrow.mockResolvedValue({
        id: 'teacher-1',
        phone: '09123456789',
        instituteId: 'inst-1',
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.resetPassword(
        mockAdmin,
        'teacher-1',
        'NewSecret123',
      );
      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'teacher-1', instituteId: 'inst-1' },
          data: expect.objectContaining({
            password: expect.any(String),
          }),
        }),
      );
    });
  });
});
