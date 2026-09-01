/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { JwtPayload } from '@workspace/types';

describe('BranchesService', () => {
  let service: BranchesService;
  let prismaService: any;

  const mockAdminUser: JwtPayload = {
    sub: 'user-admin',
    role: 'ADMIN',
    instituteId: 'inst-1',
    phone: '09120000001',
  };

  const mockSuperAdmin: JwtPayload = {
    sub: 'user-super',
    role: 'SUPER_ADMIN',
    instituteId: 'inst-system',
    phone: '09120000000',
  };

  beforeEach(async () => {
    prismaService = {
      branch: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      institute: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        I18nService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return branches with counts for current institute', async () => {
      prismaService.branch.findMany.mockResolvedValue([
        {
          id: 'branch-1',
          instituteId: 'inst-1',
          name: 'Central Branch',
          address: 'Tehran, Azadi St.',
          phones: ['02166000000'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { classes: 4, users: 15 },
        },
      ]);

      const result = await service.findAll(mockAdminUser);
      expect(result).toHaveLength(1);
      expect(result[0].classesCount).toBe(4);
      expect(result[0].usersCount).toBe(15);
      expect(prismaService.branch.findMany).toHaveBeenCalledWith({
        where: { instituteId: 'inst-1' },
        include: { _count: { select: { classes: true, users: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should support targetInstituteId for SUPER_ADMIN', async () => {
      prismaService.branch.findMany.mockResolvedValue([]);

      await service.findAll(mockSuperAdmin, 'inst-other');
      expect(prismaService.branch.findMany).toHaveBeenCalledWith({
        where: { instituteId: 'inst-other' },
        include: { _count: { select: { classes: true, users: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should auto-create Central Branch if institute has zero branches', async () => {
      prismaService.branch.findMany.mockResolvedValue([]);
      prismaService.institute.findUnique.mockResolvedValue({
        id: 'inst-1',
        name: 'Kalameh Tehran',
        subdomain: 'tehran',
        address: 'Azadi St',
        phones: ['02166001122'],
      });
      prismaService.branch.create.mockResolvedValue({
        id: 'branch-auto',
        instituteId: 'inst-1',
        name: 'شعبه مرکزی',
        address: 'Azadi St',
        phones: ['02166001122'],
        isActive: true,
        _count: { classes: 0, users: 0 },
      });

      const result = await service.findAll(mockAdminUser);
      expect(prismaService.branch.create).toHaveBeenCalledWith({
        data: {
          instituteId: 'inst-1',
          name: 'شعبه مرکزی',
          address: 'Azadi St',
          phones: ['02166001122'],
          isActive: true,
        },
        include: { _count: { select: { classes: true, users: true } } },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('شعبه مرکزی');
    });
  });

  describe('findOne', () => {
    it('should return branch with stats', async () => {
      prismaService.branch.findFirst.mockResolvedValue({
        id: 'branch-1',
        instituteId: 'inst-1',
        name: 'Central Branch',
        address: null,
        phones: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 2, users: 5 },
      });

      const result = await service.findOne('branch-1', mockAdminUser, 'en');
      expect(result.id).toBe('branch-1');
      expect(result.classesCount).toBe(2);
      expect(result.usersCount).toBe(5);
    });

    it('should throw NotFoundException if branch does not exist', async () => {
      prismaService.branch.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('branch-unknown', mockAdminUser, 'en'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new branch successfully', async () => {
      prismaService.branch.findFirst.mockResolvedValue(null);
      prismaService.branch.create.mockResolvedValue({
        id: 'branch-new',
        instituteId: 'inst-1',
        name: 'West Branch',
        address: 'Tehran, West',
        phones: ['02144000000'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0, users: 0 },
      });

      const result = await service.create(
        {
          name: 'West Branch',
          address: 'Tehran, West',
          phones: ['02144000000'],
          isActive: true,
        },
        mockAdminUser,
        'en',
      );

      expect(result.id).toBe('branch-new');
      expect(result.classesCount).toBe(0);
      expect(result.usersCount).toBe(0);
      expect(prismaService.branch.create).toHaveBeenCalledWith({
        data: {
          instituteId: 'inst-1',
          name: 'West Branch',
          address: 'Tehran, West',
          phones: ['02144000000'],
          isActive: true,
        },
        include: {
          _count: { select: { classes: true, users: true } },
        },
      });
    });

    it('should throw ConflictException if branch name already exists', async () => {
      prismaService.branch.findFirst.mockResolvedValue({
        id: 'branch-existing',
      });

      await expect(
        service.create({ name: 'Central Branch' }, mockAdminUser, 'en'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update branch details successfully', async () => {
      prismaService.branch.findFirst
        .mockResolvedValueOnce({
          id: 'branch-1',
          instituteId: 'inst-1',
          name: 'Central Branch',
          address: null,
          phones: [],
          isActive: true,
          _count: { classes: 2, users: 5 },
        })
        .mockResolvedValueOnce(null); // No duplicate name

      prismaService.branch.update.mockResolvedValue({
        id: 'branch-1',
        instituteId: 'inst-1',
        name: 'Central Branch Updated',
        address: 'New Address',
        phones: ['02166111111'],
        isActive: true,
        _count: { classes: 2, users: 5 },
      });

      const result = await service.update(
        'branch-1',
        {
          name: 'Central Branch Updated',
          address: 'New Address',
          phones: ['02166111111'],
        },
        mockAdminUser,
        'en',
      );

      expect(result.name).toBe('Central Branch Updated');
      expect(prismaService.branch.update).toHaveBeenCalledWith({
        where: { id: 'branch-1' },
        data: {
          name: 'Central Branch Updated',
          address: 'New Address',
          phones: ['02166111111'],
        },
        include: {
          _count: { select: { classes: true, users: true } },
        },
      });
    });

    it('should throw ConflictException if updated name collides with another branch', async () => {
      prismaService.branch.findFirst
        .mockResolvedValueOnce({
          id: 'branch-1',
          instituteId: 'inst-1',
          name: 'Central Branch',
          _count: { classes: 0, users: 0 },
        })
        .mockResolvedValueOnce({
          id: 'branch-2',
          name: 'West Branch',
        });

      await expect(
        service.update(
          'branch-1',
          { name: 'West Branch' },
          mockAdminUser,
          'en',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
