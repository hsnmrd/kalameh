/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      institute: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
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

  describe('POST /auth/login', () => {
    it('should log in successfully and set HttpOnly access_token cookie', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const mockInstitute = {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        subdomain: 'tehran',
        isActive: true,
      };
      const mockUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        instituteId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        phone: '09123456789',
        password: hashedPassword,
        role: 'INSTITUTE_ADMIN',
        firstName: 'Ali',
        lastName: 'Rezaei',
        isActive: true,
        institute: mockInstitute,
      };

      prismaService.institute.findFirstOrThrow.mockResolvedValue(mockInstitute);
      prismaService.user.findMany.mockResolvedValue([mockUser]);

      const response = await request(app.getHttpAdapter().getInstance())
        .post('/auth/login')
        .send({
          phone: '09123456789',
          password: '123456',
          subdomain: 'tehran',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toMatchObject({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        role: 'INSTITUTE_ADMIN',
        firstName: 'Ali',
        lastName: 'Rezaei',
      });

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('access_token='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
    });

    it('should return 400 when validation fails (invalid phone number)', async () => {
      const response = await request(app.getHttpAdapter().getInstance())
        .post('/auth/login')
        .send({
          phone: 'invalid-phone',
          password: '123456',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 401 on invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correct-pwd', 10);
      const mockInstitute = {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        subdomain: 'tehran',
        isActive: true,
      };
      const mockUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        instituteId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        phone: '09123456789',
        password: hashedPassword,
        isActive: true,
        institute: mockInstitute,
      };

      prismaService.institute.findFirstOrThrow.mockResolvedValue(mockInstitute);
      prismaService.user.findMany.mockResolvedValue([mockUser]);

      const response = await request(app.getHttpAdapter().getInstance())
        .post('/auth/login')
        .send({
          phone: '09123456789',
          password: 'wrong-password',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /auth/me & POST /auth/logout (Protected Routes)', () => {
    it('should return 401 on /auth/me when unauthenticated', async () => {
      await request(app.getHttpAdapter().getInstance())
        .get('/auth/me')
        .expect(401);
    });

    it('should return profile on /auth/me with valid Bearer token and active user', async () => {
      const hashedPassword = await bcrypt.hash('123456', 10);
      const mockInstitute = {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        subdomain: 'tehran',
        isActive: true,
      };
      const mockUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        instituteId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        phone: '09123456789',
        password: hashedPassword,
        role: 'STUDENT',
        firstName: 'Ali',
        lastName: 'Rezaei',
        isActive: true,
        institute: mockInstitute,
      };

      prismaService.institute.findFirstOrThrow.mockResolvedValue(mockInstitute);
      prismaService.user.findMany.mockResolvedValue([mockUser]);
      prismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      // 1. Login to get token
      const loginRes = await request(app.getHttpAdapter().getInstance())
        .post('/auth/login')
        .send({
          phone: '09123456789',
          password: '123456',
        });

      const token = loginRes.body.accessToken as string;

      // 2. Fetch /auth/me
      const profileRes = await request(app.getHttpAdapter().getInstance())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileRes.body.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(profileRes.body.phone).toBe('09123456789');

      // 3. Logout with token
      const logoutRes = await request(app.getHttpAdapter().getInstance())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const cookies = logoutRes.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.includes('access_token=;'))).toBe(true);
    });
  });
});
