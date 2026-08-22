/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Education & Classes Infrastructure (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: any;
  let adminToken: string;
  let studentToken: string;

  const mockInstitute = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Tehran Institute',
    subdomain: 'tehran',
    isActive: true,
  };

  const mockAdmin = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    instituteId: mockInstitute.id,
    phone: '09121111111',
    password: '',
    role: 'INSTITUTE_ADMIN',
    firstName: 'Manager',
    lastName: 'Tehran',
    isActive: true,
    institute: mockInstitute,
  };

  const mockStudent = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    instituteId: mockInstitute.id,
    phone: '09122222222',
    password: '',
    role: 'STUDENT',
    firstName: 'Ali',
    lastName: 'Rezaei',
    isActive: true,
    institute: mockInstitute,
    currentAllowedCourseId: 'course-tn1-id',
  };

  beforeEach(async () => {
    mockAdmin.password = await bcrypt.hash('admin123', 10);
    mockStudent.password = await bcrypt.hash('student123', 10);

    prismaService = {
      institute: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      term: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      course: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      class: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      enrollment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prismaService)),
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

    // Configure user lookups for JwtStrategy
    prismaService.user.findUnique.mockImplementation(({ where }: any) => {
      if (where.id === mockAdmin.id) return mockAdmin;
      if (where.id === mockStudent.id) return mockStudent;
      return null;
    });

    prismaService.user.findUniqueOrThrow.mockImplementation(
      ({ where }: any) => {
        if (where.id === mockAdmin.id) return mockAdmin;
        if (where.id === mockStudent.id) return mockStudent;
        return mockAdmin;
      },
    );

    // Login as Admin
    prismaService.institute.findFirstOrThrow.mockResolvedValue(mockInstitute);
    prismaService.user.findMany.mockResolvedValue([mockAdmin]);

    const adminLoginRes = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: '09121111111',
        password: 'admin123',
        subdomain: 'tehran',
      });
    adminToken = adminLoginRes.body.accessToken as string;

    // Login as Student
    prismaService.user.findMany.mockResolvedValue([mockStudent]);

    const studentLoginRes = await request(app.getHttpAdapter().getInstance())
      .post('/auth/login')
      .send({
        phone: '09122222222',
        password: 'student123',
        subdomain: 'tehran',
      });
    studentToken = studentLoginRes.body.accessToken as string;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Terms API', () => {
    it('POST /terms - should create a new term for institute', async () => {
      const newTermDto = {
        title: 'پاییز ۱۴۰۵',
        startDate: '2026-09-23T00:00:00.000Z',
        endDate: '2026-12-21T00:00:00.000Z',
        isActive: true,
      };

      prismaService.term.findFirst.mockResolvedValue(null);
      prismaService.term.create.mockResolvedValue({
        id: 'new-term-id',
        instituteId: mockInstitute.id,
        ...newTermDto,
        startDate: new Date(newTermDto.startDate),
        endDate: new Date(newTermDto.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0 },
      });

      const res = await request(app.getHttpAdapter().getInstance())
        .post('/terms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTermDto)
        .expect(201);

      expect(res.body).toHaveProperty('id', 'new-term-id');
      expect(res.body.title).toBe('پاییز ۱۴۰۵');
    });

    it('GET /terms - should list terms for institute', async () => {
      prismaService.term.findMany.mockResolvedValue([
        {
          id: 'term-1',
          instituteId: mockInstitute.id,
          title: 'پاییز ۱۴۰۵',
          startDate: new Date(),
          endDate: new Date(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { classes: 3 },
        },
      ]);

      const res = await request(app.getHttpAdapter().getInstance())
        .get('/terms')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].classesCount).toBe(3);
    });
  });

  describe('Courses API', () => {
    it('POST /courses - should create course with base fee', async () => {
      const newCourseDto = {
        title: 'Top Notch 1A',
        baseFee: 1500000,
      };

      prismaService.course.findFirst.mockResolvedValue(null);
      prismaService.course.create.mockResolvedValue({
        id: 'new-course-id',
        instituteId: mockInstitute.id,
        ...newCourseDto,
        prerequisiteId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0 },
      });

      const res = await request(app.getHttpAdapter().getInstance())
        .post('/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCourseDto)
        .expect(201);

      expect(res.body).toHaveProperty('id', 'new-course-id');
      expect(res.body.title).toBe('Top Notch 1A');
    });
  });

  describe('Classes API', () => {
    it('POST /classes - should create class attached to term and course', async () => {
      const newClassDto = {
        title: 'Top Notch 1A - Group 1',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        capacity: 15,
        fee: 1500000,
        teacherName: 'Dr. Ahmadi',
        schedule: 'Sat, Wed 16:00-18:00',
      };

      prismaService.term.findFirst.mockResolvedValue({
        id: newClassDto.termId,
      });
      prismaService.course.findFirst.mockResolvedValue({
        id: newClassDto.courseId,
      });
      prismaService.class.create.mockResolvedValue({
        id: 'new-class-id',
        instituteId: mockInstitute.id,
        ...newClassDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { enrollments: 0 },
      });

      const res = await request(app.getHttpAdapter().getInstance())
        .post('/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newClassDto)
        .expect(201);

      expect(res.body).toHaveProperty('id', 'new-class-id');
      expect(res.body.capacity).toBe(15);
    });

    it('GET /classes/available - student should get classes for their allowed level', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockStudent);
      prismaService.course.findUnique.mockResolvedValue({
        id: 'course-tn1-id',
        title: 'Top Notch 1',
      });
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'class-avail-1',
          title: 'Top Notch 1 - Morning',
          capacity: 15,
          fee: 1500000,
          _count: { enrollments: 4 },
        },
      ]);

      const res = await request(app.getHttpAdapter().getInstance())
        .get('/classes/available')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('allowedCourseTitle', 'Top Notch 1');
      expect(res.body.classes).toHaveLength(1);
    });
  });

  describe('Grades API', () => {
    it('POST /grades/classes/:classId - should submit scores and auto progress student level', async () => {
      const classId = 'class-to-grade';
      const studentId = mockStudent.id;

      prismaService.class.findFirst.mockResolvedValue({
        id: classId,
        instituteId: mockInstitute.id,
        courseId: 'course-tn1-id',
      });

      prismaService.course.findFirst.mockResolvedValue({
        id: 'course-tn2-id',
        instituteId: mockInstitute.id,
        title: 'Top Notch 2',
        prerequisiteId: 'course-tn1-id',
      });

      prismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-mock-id',
        studentId,
        classId,
      });

      const payload = {
        grades: [
          {
            studentId,
            finalScore: 92,
            isPassed: true,
          },
        ],
      };

      const res = await request(app.getHttpAdapter().getInstance())
        .post(`/grades/classes/${classId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('updatedCount', 1);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: studentId },
        data: { currentAllowedCourseId: 'course-tn2-id' },
      });
    });
  });
});
