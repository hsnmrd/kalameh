/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '@workspace/types';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let prismaService: any;

  const mockAdmin: JwtPayload = {
    sub: 'admin-user-id',
    phone: '09121111111',
    role: 'ADMIN',
    instituteId: 'inst-1',
  };

  const mockSuperAdmin: JwtPayload = {
    sub: 'superadmin-id',
    phone: '09120000001',
    role: 'SUPER_ADMIN',
    instituteId: 'platform-inst',
  };

  beforeEach(async () => {
    prismaService = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
  });

  describe('log', () => {
    it('should safely write log to prisma', async () => {
      prismaService.auditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.log({
        instituteId: 'inst-1',
        userId: 'user-1',
        module: 'CLASS',
        entityId: 'class-1',
        action: 'CREATE',
        metadata: { fee: 1000 },
      });

      expect(prismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          instituteId: 'inst-1',
          userId: 'user-1',
          module: 'CLASS',
          entityId: 'class-1',
          action: 'CREATE',
          description: null,
          metadata: { fee: 1000 },
        },
      });
    });

    it('should not throw error if prisma create fails', async () => {
      prismaService.auditLog.create.mockRejectedValue(
        new Error('DB connection error'),
      );

      await expect(
        service.log({
          instituteId: 'inst-1',
          userId: 'user-1',
          module: 'CLASS',
          entityId: 'class-1',
          action: 'CREATE',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('findAll', () => {
    it('should scope queries to institute for regular ADMIN', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([
        { id: 'log-1', module: 'CLASS', entityId: 'c-1' },
      ]);

      const result = await service.findAll(mockAdmin, { module: 'CLASS' });
      expect(result).toHaveLength(1);
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            instituteId: 'inst-1',
            module: 'CLASS',
          }),
        }),
      );
    });

    it('should allow SUPER_ADMIN to filter by target institute', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([]);

      await service.findAll(mockSuperAdmin, { instituteId: 'inst-target' });
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            instituteId: 'inst-target',
          }),
        }),
      );
    });
  });

  describe('findByEntity', () => {
    it('should call findAll with module and entityId', async () => {
      prismaService.auditLog.findMany.mockResolvedValue([]);

      await service.findByEntity(mockAdmin, 'CLASS', 'c-123');
      expect(prismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            instituteId: 'inst-1',
            module: 'CLASS',
            entityId: 'c-123',
          }),
        }),
      );
    });
  });
});
