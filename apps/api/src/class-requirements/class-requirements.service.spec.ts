/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ClassRequirementFilterSchema,
  ROLES,
  type JwtPayload,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClassRequirementsService } from './class-requirements.service';

describe('MVP-014 ClassRequirementsService', () => {
  let service: ClassRequirementsService;
  let prisma: any;
  let auditLogs: any;

  const instituteId = '00000000-0000-4000-8000-000000000001';
  const requirementId = '00000000-0000-4000-8000-000000000002';
  const termId = '00000000-0000-4000-8000-000000000003';
  const courseId = '00000000-0000-4000-8000-000000000004';
  const branchId = '00000000-0000-4000-8000-000000000005';
  const admin: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000006',
    phone: '09120000000',
    role: ROLES.ADMIN,
    instituteId,
  };
  const requirement = {
    id: requirementId,
    instituteId,
    termId,
    courseId,
    branchId,
    requiredClassCount: 2,
    capacity: 12,
    sessionDurationMinutes: 90,
    sessionsPerWeek: 2,
    totalSessions: null,
    deliveryMode: 'IN_PERSON',
    isActive: true,
    term: { id: termId, title: 'Fall' },
    course: { id: courseId, title: 'A2' },
    branch: { id: branchId, name: 'Main' },
    createdAt: new Date('2026-09-08'),
    updatedAt: new Date('2026-09-08'),
  };

  beforeEach(async () => {
    prisma = {
      classRequirement: {
        findMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      term: { findFirstOrThrow: jest.fn() },
      course: { findFirstOrThrow: jest.fn() },
      branch: { findFirstOrThrow: jest.fn() },
    };
    auditLogs = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassRequirementsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
        { provide: AuditLogsService, useValue: auditLogs },
      ],
    }).compile();

    service = module.get(ClassRequirementsService);
  });

  it('normalizes list filters through the shared schema', () => {
    expect(
      ClassRequirementFilterSchema.parse({
        branchId: 'NONE',
        isActive: 'ACTIVE',
      }),
    ).toEqual({ branchId: null, isActive: true });
  });

  it('lists only requirements from the caller institute', async () => {
    prisma.classRequirement.findMany.mockResolvedValue([requirement]);

    await expect(
      service.findAll(admin, { termId, isActive: true }),
    ).resolves.toEqual([requirement]);
    expect(prisma.classRequirement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { instituteId, termId, isActive: true },
      }),
    );
  });

  it('requires super admin to choose an institute explicitly', async () => {
    await expect(
      service.findAll({ ...admin, role: ROLES.SUPER_ADMIN }, {}),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.classRequirement.findMany).not.toHaveBeenCalled();
  });

  it('creates a requirement after validating every tenant reference', async () => {
    prisma.term.findFirstOrThrow.mockResolvedValue({ id: termId });
    prisma.course.findFirstOrThrow.mockResolvedValue({ id: courseId });
    prisma.branch.findFirstOrThrow.mockResolvedValue({ id: branchId });
    prisma.classRequirement.create.mockResolvedValue(requirement);

    const result = await service.create(admin, {
      termId,
      courseId,
      branchId,
      requiredClassCount: 2,
      capacity: 12,
      sessionDurationMinutes: 90,
      sessionsPerWeek: 2,
      deliveryMode: 'IN_PERSON',
      isActive: true,
    });

    expect(prisma.term.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: termId, instituteId },
      select: { id: true },
    });
    expect(prisma.course.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: courseId, instituteId },
      select: { id: true },
    });
    expect(prisma.branch.findFirstOrThrow).toHaveBeenCalledWith({
      where: { id: branchId, instituteId },
      select: { id: true },
    });
    expect(prisma.classRequirement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ instituteId, termId, courseId }),
      }),
    );
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({
        instituteId,
        entityId: requirementId,
        action: 'CREATE',
      }),
    );
    expect(result.id).toBe(requirementId);
  });

  it('rejects a cross-tenant reference before creating data', async () => {
    prisma.term.findFirstOrThrow.mockRejectedValue(new NotFoundException());
    prisma.course.findFirstOrThrow.mockResolvedValue({ id: courseId });
    prisma.branch.findFirstOrThrow.mockResolvedValue({ id: branchId });

    await expect(
      service.create(admin, {
        termId,
        courseId,
        branchId,
        requiredClassCount: 2,
        capacity: 12,
        sessionDurationMinutes: 90,
        sessionsPerWeek: 2,
        deliveryMode: 'IN_PERSON',
        isActive: true,
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.classRequirement.create).not.toHaveBeenCalled();
  });

  it('rejects an update that would leave both cadence modes active', async () => {
    prisma.classRequirement.findFirstOrThrow.mockResolvedValue(requirement);

    await expect(
      service.update(admin, requirementId, { totalSessions: 24 }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.classRequirement.update).not.toHaveBeenCalled();
  });

  it('switches cadence when the previous mode is explicitly cleared', async () => {
    prisma.classRequirement.findFirstOrThrow.mockResolvedValue(requirement);
    prisma.term.findFirstOrThrow.mockResolvedValue({ id: termId });
    prisma.course.findFirstOrThrow.mockResolvedValue({ id: courseId });
    prisma.branch.findFirstOrThrow.mockResolvedValue({ id: branchId });
    prisma.classRequirement.update.mockResolvedValue({
      ...requirement,
      sessionsPerWeek: null,
      totalSessions: 24,
    });

    await service.update(admin, requirementId, {
      sessionsPerWeek: null,
      totalSessions: 24,
    });

    expect(prisma.classRequirement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: requirementId, instituteId },
        data: expect.objectContaining({
          sessionsPerWeek: null,
          totalSessions: 24,
        }),
      }),
    );
  });

  it('soft-deactivates instead of deleting requirement history', async () => {
    prisma.classRequirement.findFirstOrThrow.mockResolvedValue(requirement);
    prisma.classRequirement.update.mockResolvedValue({
      ...requirement,
      isActive: false,
    });

    const result = await service.deactivate(admin, requirementId);

    expect(prisma.classRequirement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: requirementId, instituteId },
        data: { isActive: false },
      }),
    );
    expect(result.isActive).toBe(false);
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DEACTIVATE' }),
    );
  });
});
