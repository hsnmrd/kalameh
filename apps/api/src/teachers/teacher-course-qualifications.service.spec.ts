/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ReplaceTeacherCoursesSchema,
  ROLES,
  type JwtPayload,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeachersService } from './teachers.service';

describe('MVP-013 teacher course qualifications API service', () => {
  let service: TeachersService;
  let prisma: any;
  let auditLogs: any;

  const instituteId = '00000000-0000-4000-8000-000000000001';
  const teacherId = '00000000-0000-4000-8000-000000000002';
  const profileId = '00000000-0000-4000-8000-000000000003';
  const courseId = '00000000-0000-4000-8000-000000000004';
  const qualificationId = '00000000-0000-4000-8000-000000000005';
  const admin: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000006',
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId,
  };

  const qualification = {
    id: qualificationId,
    instituteId,
    teacherProfileId: profileId,
    courseId,
    course: { id: courseId, title: 'A2' },
    createdAt: new Date('2026-09-08'),
    updatedAt: new Date('2026-09-08'),
  };

  beforeEach(async () => {
    prisma = {
      user: { findFirstOrThrow: jest.fn() },
      course: { findMany: jest.fn() },
      teacherProfile: { upsert: jest.fn() },
      teacherCourseQualification: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };
    auditLogs = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = module.get(TeachersService);
  });

  it('deduplicates course IDs in the shared request schema', () => {
    expect(
      ReplaceTeacherCoursesSchema.parse({ courseIds: [courseId, courseId] }),
    ).toEqual({ courseIds: [courseId] });
  });

  it('reads qualifications through an institute-scoped teacher lookup', async () => {
    prisma.user.findFirstOrThrow.mockResolvedValue({
      id: teacherId,
      instituteId,
      teacherProfile: {
        id: profileId,
        teachableCourses: [qualification],
      },
    });

    await expect(
      service.findCourseQualifications(admin, teacherId),
    ).resolves.toEqual([qualification]);
    expect(prisma.user.findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: teacherId, instituteId, role: ROLES.TEACHER },
      }),
    );
  });

  it('requires an explicit institute for a super admin', async () => {
    const superAdmin: JwtPayload = {
      ...admin,
      role: ROLES.SUPER_ADMIN,
    };

    await expect(
      service.findCourseQualifications(superAdmin, teacherId),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.findFirstOrThrow).not.toHaveBeenCalled();
  });

  it('rejects a course outside the teacher institute before mutation', async () => {
    prisma.user.findFirstOrThrow.mockResolvedValue({
      id: teacherId,
      instituteId,
      teacherProfile: { id: profileId, teachableCourses: [] },
    });
    prisma.course.findMany.mockResolvedValue([]);

    await expect(
      service.replaceCourseQualifications(admin, teacherId, {
        courseIds: [courseId],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('atomically replaces and returns title-sorted qualifications', async () => {
    prisma.user.findFirstOrThrow.mockResolvedValue({
      id: teacherId,
      instituteId,
      teacherProfile: {
        id: profileId,
        teachableCourses: [{ ...qualification, courseId: qualificationId }],
      },
    });
    prisma.course.findMany.mockResolvedValue([{ id: courseId }]);
    prisma.teacherProfile.upsert.mockResolvedValue({ id: profileId });
    prisma.teacherCourseQualification.deleteMany.mockResolvedValue({
      count: 1,
    });
    prisma.teacherCourseQualification.createMany.mockResolvedValue({
      count: 1,
    });
    prisma.teacherCourseQualification.findMany.mockResolvedValue([
      qualification,
    ]);

    const result = await service.replaceCourseQualifications(admin, teacherId, {
      courseIds: [courseId],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.teacherCourseQualification.deleteMany).toHaveBeenCalledWith({
      where: { instituteId, teacherProfileId: profileId },
    });
    expect(prisma.teacherCourseQualification.createMany).toHaveBeenCalledWith({
      data: [{ instituteId, teacherProfileId: profileId, courseId }],
    });
    expect(prisma.teacherCourseQualification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { instituteId, teacherProfileId: profileId },
        orderBy: { course: { title: 'asc' } },
      }),
    );
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({
        instituteId,
        entityId: teacherId,
        action: 'REPLACE',
        metadata: {
          previousCourseIds: [qualificationId],
          courseIds: [courseId],
        },
      }),
    );
    expect(result).toEqual([qualification]);
  });

  it('supports clearing every qualification without creating rows', async () => {
    prisma.user.findFirstOrThrow.mockResolvedValue({
      id: teacherId,
      instituteId,
      teacherProfile: { id: profileId, teachableCourses: [qualification] },
    });
    prisma.teacherProfile.upsert.mockResolvedValue({ id: profileId });
    prisma.teacherCourseQualification.deleteMany.mockResolvedValue({
      count: 1,
    });
    prisma.teacherCourseQualification.findMany.mockResolvedValue([]);

    await expect(
      service.replaceCourseQualifications(admin, teacherId, { courseIds: [] }),
    ).resolves.toEqual([]);
    expect(prisma.teacherCourseQualification.createMany).not.toHaveBeenCalled();
  });
});
