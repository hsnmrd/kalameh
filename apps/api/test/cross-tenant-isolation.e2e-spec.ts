/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Cross-Tenant Isolation & Multi-Tenancy Security (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: any;

  const instituteTehran = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Tehran Institute',
    subdomain: 'tehran',
    isActive: true,
  };

  const instituteShiraz = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Shiraz Institute',
    subdomain: 'shiraz',
    isActive: true,
  };

  const userTehran = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    instituteId: instituteTehran.id,
    phone: '09121111111',
    password: '',
    role: 'STUDENT',
    firstName: 'Ali',
    lastName: 'Tehrani',
    isActive: true,
    institute: instituteTehran,
  };

  const adminTehran = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    instituteId: instituteTehran.id,
    phone: '09123333333',
    password: '',
    role: 'INSTITUTE_ADMIN',
    firstName: 'Manager',
    lastName: 'Tehran',
    isActive: true,
    institute: instituteTehran,
  };

  beforeEach(async () => {
    userTehran.password = await bcrypt.hash('tehran123', 10);
    adminTehran.password = await bcrypt.hash('admin123', 10);

    prismaService = {
      institute: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should prevent User of Institute 1 from logging in with Institute 2 subdomain', async () => {
    // When subdomain is 'shiraz', findFirstOrThrow returns instituteShiraz
    prismaService.institute.findFirstOrThrow.mockResolvedValue(instituteShiraz);
    // User is not found in instituteShiraz
    prismaService.user.findMany.mockResolvedValue([]);

    const response = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: userTehran.phone,
        password: 'tehran123',
        subdomain: 'shiraz',
      })
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });

  it('should strictly scope user queries to the authenticated admin institute', async () => {
    prismaService.institute.findFirstOrThrow.mockResolvedValue(instituteTehran);
    prismaService.user.findMany.mockResolvedValue([adminTehran]);
    prismaService.user.findUniqueOrThrow.mockResolvedValue(adminTehran);

    // 1. Login as Tehran admin
    const loginRes = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: adminTehran.phone,
        password: 'admin123',
        subdomain: 'tehran',
      });

    const token = loginRes.body.accessToken as string;

    // 2. Fetch /users
    prismaService.user.findMany.mockResolvedValue([userTehran]);

    await request(app.getHttpAdapter().getInstance())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify Prisma findMany was called with where: { instituteId: instituteTehran.id }
    expect(prismaService.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          instituteId: instituteTehran.id,
        }),
      }),
    );
  });

  it('should reject login with 401 Unauthorized when institute is deactivated', async () => {
    const deactivatedInstitute = {
      ...instituteTehran,
      isActive: false,
    };

    prismaService.institute.findFirstOrThrow.mockResolvedValue(
      deactivatedInstitute,
    );

    const response = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: userTehran.phone,
        password: 'tehran123',
        subdomain: 'tehran',
      })
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });

  it('should reject login with 401 Unauthorized when user account is deactivated', async () => {
    const deactivatedUser = {
      ...userTehran,
      isActive: false,
    };

    prismaService.institute.findFirstOrThrow.mockResolvedValue(instituteTehran);
    prismaService.user.findMany.mockResolvedValue([deactivatedUser]);

    const response = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: userTehran.phone,
        password: 'tehran123',
        subdomain: 'tehran',
      })
      .expect(401);

    expect(response.body).toHaveProperty('message');
  });
});
