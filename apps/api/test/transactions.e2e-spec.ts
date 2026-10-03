/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import type { App } from 'supertest/types';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { APP_MODULES, ROLES, TRANSACTION_STATUSES } from '@workspace/types';

describe('TransactionsController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: any;
  let adminToken: string;
  let studentToken: string;

  const institute = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    subdomain: 'tehran',
    isActive: true,
    enabledModules: [APP_MODULES.FINANCE],
  };
  const admin = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    instituteId: institute.id,
    phone: '09121111111',
    password: '',
    role: ROLES.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    institute,
  };
  const student = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    instituteId: institute.id,
    phone: '09123333333',
    password: '',
    role: ROLES.STUDENT,
    firstName: 'Ali',
    lastName: 'Rezaei',
    isActive: true,
    institute,
  };
  const transaction = {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    instituteId: institute.id,
    studentId: student.id,
    amount: 1_500_000,
    trackingCode: 'TRACK-100',
    receiptImageUrl: '/uploads/transactions/receipt.png',
    status: TRANSACTION_STATUSES.PENDING,
    paymentDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    student,
  };

  beforeEach(async () => {
    admin.password = await bcrypt.hash('admin123', 10);
    student.password = await bcrypt.hash('student123', 10);
    prisma = {
      institute: { findFirstOrThrow: jest.fn() },
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(({ where }) => {
          if (where.id === admin.id) return admin;
          if (where.id === student.id) return student;
          return null;
        }),
        findFirstOrThrow: jest.fn(),
      },
      transaction: {
        findMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();

    prisma.institute.findFirstOrThrow.mockResolvedValue(institute);
    prisma.user.findMany.mockResolvedValue([admin]);
    const adminLogin = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({ phone: admin.phone, password: 'admin123', subdomain: 'tehran' });
    adminToken = adminLogin.body.accessToken as string;

    prisma.user.findMany.mockResolvedValue([student]);
    const studentLogin = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: student.phone,
        password: 'student123',
        subdomain: 'tehran',
      });
    studentToken = studentLogin.body.accessToken as string;
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists only transactions from the authenticated institute', async () => {
    prisma.transaction.findMany.mockResolvedValue([transaction]);

    const response = await request(app.getHttpAdapter().getInstance())
      .get('/transactions?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: institute.id }),
      }),
    );
  });

  it('allows an authorized admin to approve a pending transaction', async () => {
    prisma.transaction.findFirstOrThrow.mockResolvedValue(transaction);
    prisma.transaction.update.mockResolvedValue({
      ...transaction,
      status: TRANSACTION_STATUSES.APPROVED,
    });

    const response = await request(app.getHttpAdapter().getInstance())
      .patch(`/transactions/${transaction.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: TRANSACTION_STATUSES.APPROVED })
      .expect(200);

    expect(response.body.status).toBe(TRANSACTION_STATUSES.APPROVED);
  });

  it('validates that student submissions include a receipt image', async () => {
    await request(app.getHttpAdapter().getInstance())
      .post('/transactions')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('amount', '1500000')
      .field('trackingCode', 'TRACK-100')
      .expect(400);
  });

  it('rejects unauthenticated transaction access', async () => {
    await request(app.getHttpAdapter().getInstance())
      .get('/transactions')
      .expect(401);
  });
});
