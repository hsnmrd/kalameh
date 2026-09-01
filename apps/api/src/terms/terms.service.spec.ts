/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TermsService } from './terms.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { JwtPayload } from '@workspace/types';

describe('TermsService', () => {
  let service: TermsService;
  let prismaService: any;
  let i18nService: any;

  const mockAdmin: JwtPayload = {
    sub: 'admin-id',
    phone: '09121111111',
    role: 'ADMIN',
    instituteId: 'inst-1',
  };

  beforeEach(async () => {
    prismaService = {
      term: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    i18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: I18nService, useValue: i18nService },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<TermsService>(TermsService);
  });

  describe('findAll', () => {
    it('should return terms scoped to institute', async () => {
      const mockTerms = [
        {
          id: 'term-1',
          instituteId: 'inst-1',
          title: 'پاییز ۱۴۰۵',
          startDate: new Date('2026-09-23'),
          endDate: new Date('2026-12-21'),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { classes: 5 },
        },
      ];

      prismaService.term.findMany.mockResolvedValue(mockTerms);

      const result = await service.findAll(mockAdmin);
      expect(result).toHaveLength(1);
      expect(result[0].classesCount).toBe(5);
      expect(prismaService.term.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { instituteId: 'inst-1' },
        }),
      );
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if startDate >= endDate', async () => {
      const dto = {
        title: 'ترم نامعتبر',
        startDate: '2026-12-21',
        endDate: '2026-09-23',
        isActive: true,
      };

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if term with same title exists in institute', async () => {
      const dto = {
        title: 'پاییز ۱۴۰۵',
        startDate: '2026-09-23',
        endDate: '2026-12-21',
        isActive: true,
      };

      prismaService.term.findFirst.mockResolvedValue({ id: 'existing-term' });

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create new term when valid', async () => {
      const dto = {
        title: 'پاییز ۱۴۰۵',
        startDate: '2026-09-23',
        endDate: '2026-12-21',
        isActive: true,
      };

      prismaService.term.findFirst.mockResolvedValue(null);
      prismaService.term.create.mockResolvedValue({
        id: 'new-term-id',
        instituteId: 'inst-1',
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0 },
      });

      const result = await service.create(dto, mockAdmin);
      expect(result.id).toBe('new-term-id');
      expect(result.title).toBe('پاییز ۱۴۰۵');
    });

    it('should create new term for target institute when currentUser is SUPER_ADMIN', async () => {
      const superAdmin: JwtPayload = {
        sub: 'super-admin-id',
        phone: '09120000001',
        role: 'SUPER_ADMIN',
        instituteId: 'platform-inst-id',
      };
      const dto = {
        title: 'زمستان ۱۴۰۵',
        startDate: '2026-12-22',
        endDate: '2027-03-20',
        isActive: true,
        instituteId: 'target-inst-id',
      };

      prismaService.term.findFirst.mockResolvedValue(null);
      prismaService.term.create.mockResolvedValue({
        id: 'new-term-id-2',
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0 },
      });

      const result = await service.create(dto, superAdmin);
      expect(result.id).toBe('new-term-id-2');
      expect(prismaService.term.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            instituteId: 'target-inst-id',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if term not found', async () => {
      prismaService.term.findFirst.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { title: 'نام جدید' }, mockAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
