/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { ROLES, TRANSACTION_STATUSES, type JwtPayload } from '@workspace/types';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;
  let auditLogsService: { log: jest.Mock };

  const admin: JwtPayload = {
    sub: 'admin-1',
    phone: '09121111111',
    role: ROLES.ADMIN,
    instituteId: 'inst-1',
  };
  const student: JwtPayload = {
    sub: 'student-1',
    phone: '09122222222',
    role: ROLES.STUDENT,
    instituteId: 'inst-1',
  };
  const transaction = {
    id: 'transaction-1',
    instituteId: 'inst-1',
    studentId: 'student-1',
    amount: 1_500_000,
    trackingCode: 'TRACK-1',
    receiptImageUrl: '/uploads/transactions/receipt.png',
    status: TRANSACTION_STATUSES.PENDING,
    paymentDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {
      id: 'student-1',
      firstName: 'Ali',
      lastName: 'Rezaei',
      phone: '09122222222',
      avatarUrl: null,
    },
  };

  beforeEach(async () => {
    prisma = {
      transaction: {
        findMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: { findFirstOrThrow: jest.fn() },
    };
    auditLogsService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditLogsService, useValue: auditLogsService },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
  });

  it('scopes transaction lists to the authenticated institute', async () => {
    prisma.transaction.findMany.mockResolvedValue([transaction]);

    await service.findAll(admin, {
      search: 'Ali',
      status: TRANSACTION_STATUSES.PENDING,
      instituteId: 'other-institute',
    });

    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          instituteId: 'inst-1',
          status: TRANSACTION_STATUSES.PENDING,
        }),
      }),
    );
  });

  it('creates a pending receipt for the authenticated student', async () => {
    prisma.user.findFirstOrThrow.mockResolvedValue({ id: student.sub });
    prisma.transaction.create.mockResolvedValue(transaction);

    const result = await service.create(
      student,
      { amount: 1_500_000, trackingCode: 'TRACK-1' },
      '/uploads/transactions/receipt.png',
      'en',
    );

    expect(result).toEqual(transaction);
    expect(prisma.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          instituteId: 'inst-1',
          studentId: 'student-1',
        }),
      }),
    );
    expect(auditLogsService.log).toHaveBeenCalled();
  });

  it('rejects receipt submission from a staff account', async () => {
    await expect(
      service.create(
        admin,
        { amount: 1_500_000, trackingCode: 'TRACK-1' },
        '/uploads/transactions/receipt.png',
        'en',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates status with an institute-scoped write', async () => {
    prisma.transaction.findFirstOrThrow.mockResolvedValue(transaction);
    prisma.transaction.update.mockResolvedValue({
      ...transaction,
      status: TRANSACTION_STATUSES.APPROVED,
    });

    const result = await service.updateStatus(
      transaction.id,
      { status: TRANSACTION_STATUSES.APPROVED },
      admin,
    );

    expect(result.status).toBe(TRANSACTION_STATUSES.APPROVED);
    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: transaction.id, instituteId: 'inst-1' },
      }),
    );
    expect(auditLogsService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'STATUS_UPDATE' }),
    );
  });
});
