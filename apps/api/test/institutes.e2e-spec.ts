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

describe('InstitutesController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: any;
  let superAdminToken: string;

  const mockSuperInstitute = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00',
    name: 'Super Institute',
    subdomain: 'super',
    isActive: true,
    _count: { users: 1, classes: 0 },
  };

  const mockSuperAdmin = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a00',
    instituteId: mockSuperInstitute.id,
    phone: '09120000000',
    password: '',
    role: 'SUPER_ADMIN',
    firstName: 'Super',
    lastName: 'Admin',
    isActive: true,
    institute: mockSuperInstitute,
  };

  beforeEach(async () => {
    mockSuperAdmin.password = await bcrypt.hash('super123', 10);

    prismaService = {
      institute: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
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

    // Login as Super Admin to obtain JWT token
    prismaService.institute.findFirstOrThrow.mockResolvedValue(
      mockSuperInstitute,
    );
    prismaService.user.findMany.mockResolvedValue([mockSuperAdmin]);
    prismaService.user.findUniqueOrThrow.mockResolvedValue(mockSuperAdmin);

    const loginRes = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: '09120000000',
        password: 'super123',
      });

    superAdminToken = loginRes.body.accessToken as string;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /institutes', () => {
    it('should list all institutes for SUPER_ADMIN', async () => {
      const mockList = [
        mockSuperInstitute,
        {
          id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          name: 'Tehran Branch',
          subdomain: 'tehran',
          isActive: true,
          _count: { users: 10, classes: 8 },
        },
      ];

      prismaService.institute.findMany.mockResolvedValue(mockList);

      const res = await request(app.getHttpAdapter().getInstance())
        .get('/institutes')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[1].subdomain).toBe('tehran');
    });
  });

  describe('POST /institutes', () => {
    it('should create new institute with unique subdomain', async () => {
      const newInstDto = {
        name: 'Shiraz Branch',
        subdomain: 'shiraz',
        phone: '07132223344',
      };

      prismaService.institute.findUnique.mockResolvedValue(null);
      prismaService.institute.create.mockResolvedValue({
        id: 'new-shiraz-inst-id',
        ...newInstDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app.getHttpAdapter().getInstance())
        .post('/institutes')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newInstDto)
        .expect(201);

      expect(res.body).toHaveProperty('id', 'new-shiraz-inst-id');
      expect(res.body.subdomain).toBe('shiraz');
    });
  });

  describe('PATCH /institutes/:id', () => {
    it('should update and deactivate/activate institute', async () => {
      const existing = {
        id: 'inst-to-update',
        name: 'Old Name',
        subdomain: 'old-sub',
        isActive: true,
      };

      prismaService.institute.findUniqueOrThrow.mockResolvedValue(existing);
      prismaService.institute.findUnique.mockResolvedValue(null);
      prismaService.institute.update.mockResolvedValue({
        ...existing,
        isActive: false,
        _count: { users: 5, classes: 2 },
      });

      const res = await request(app.getHttpAdapter().getInstance())
        .patch('/institutes/inst-to-update')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });
  });
});
