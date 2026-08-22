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

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: any;
  let adminToken: string;

  const mockInstitute = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    subdomain: 'tehran',
    isActive: true,
  };

  const mockAdmin = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    instituteId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    phone: '09121111111',
    password: '',
    role: 'INSTITUTE_ADMIN',
    firstName: 'Admin',
    lastName: 'User',
    isActive: true,
    institute: mockInstitute,
  };

  beforeEach(async () => {
    mockAdmin.password = await bcrypt.hash('admin123', 10);

    prismaService = {
      institute: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
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

    // Login as admin to get valid token
    prismaService.institute.findFirstOrThrow.mockResolvedValue(mockInstitute);
    prismaService.user.findMany.mockResolvedValue([mockAdmin]);
    prismaService.user.findUniqueOrThrow.mockResolvedValue(mockAdmin);

    const loginRes = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: '09121111111',
        password: 'admin123',
      });

    adminToken = loginRes.body.accessToken as string;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return list of users for authenticated institute admin', async () => {
      const mockUsersList = [
        {
          id: 'user-1',
          instituteId: mockInstitute.id,
          firstName: 'Sara',
          lastName: 'Rad',
          phone: '09123333333',
          role: 'STUDENT',
          isActive: true,
        },
      ];

      prismaService.user.findMany.mockResolvedValue(mockUsersList);

      const response = await request(app.getHttpAdapter().getInstance())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].firstName).toBe('Sara');
    });

    it('should return 401 when unauthorized', async () => {
      await request(app.getHttpAdapter().getInstance())
        .get('/users')
        .expect(401);
    });
  });

  describe('POST /users', () => {
    it('should create new student user successfully', async () => {
      const newUserDto = {
        firstName: 'Farhad',
        lastName: 'Majidi',
        phone: '09127777777',
        role: 'STUDENT',
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: 'new-user-id',
        ...newUserDto,
        instituteId: mockInstitute.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpAdapter().getInstance())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'new-user-id');
      expect(response.body).toHaveProperty('firstName', 'Farhad');
    });

    it('should return 400 when validation fails (invalid phone)', async () => {
      await request(app.getHttpAdapter().getInstance())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Farhad',
          lastName: 'Majidi',
          phone: 'invalid-phone',
        })
        .expect(400);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user successfully', async () => {
      const existingUser = {
        id: 'user-1',
        instituteId: mockInstitute.id,
        role: 'STUDENT',
        firstName: 'OldName',
      };

      prismaService.user.findFirstOrThrow.mockResolvedValue(existingUser);
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.update.mockResolvedValue({
        ...existingUser,
        firstName: 'NewName',
      });

      const response = await request(app.getHttpAdapter().getInstance())
        .patch('/users/user-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'NewName' })
        .expect(200);

      expect(response.body.firstName).toBe('NewName');
    });
  });

  describe('POST /users/:id/reset-password', () => {
    it('should reset user password', async () => {
      const existingUser = {
        id: 'user-1',
        instituteId: mockInstitute.id,
        role: 'STUDENT',
        phone: '09123333333',
      };

      prismaService.user.findFirstOrThrow.mockResolvedValue(existingUser);
      prismaService.user.update.mockResolvedValue({ id: 'user-1' });

      const response = await request(app.getHttpAdapter().getInstance())
        .post('/users/user-1/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'newPassword123' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
