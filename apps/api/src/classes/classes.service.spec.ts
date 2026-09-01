/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { JwtPayload } from '@workspace/types';

describe('ClassesService', () => {
  let service: ClassesService;
  let prismaService: any;
  let i18nService: any;

  const mockAdmin: JwtPayload = {
    sub: 'admin-id',
    phone: '09121111111',
    role: 'ADMIN',
    instituteId: 'inst-1',
  };

  const mockStudent: JwtPayload = {
    sub: 'student-id',
    phone: '09129999999',
    role: 'STUDENT',
    instituteId: 'inst-1',
  };

  beforeEach(async () => {
    prismaService = {
      class: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      term: {
        findFirst: jest.fn(),
      },
      course: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      branch: {
        findFirst: jest.fn(),
      },
    };

    i18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: prismaService },
        { provide: I18nService, useValue: i18nService },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  describe('create', () => {
    it('should throw BadRequestException if Term does not exist', async () => {
      const dto = {
        title: 'Class 101',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        capacity: 15,
        fee: 1500000,
      };

      prismaService.term.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if Course does not exist', async () => {
      const dto = {
        title: 'Class 101',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        capacity: 15,
        fee: 1500000,
      };

      prismaService.term.findFirst.mockResolvedValue({ id: dto.termId });
      prismaService.course.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create class successfully', async () => {
      const dto = {
        title: 'Class 101',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        capacity: 15,
        fee: 1500000,
        teacherName: 'Dr. Ahmadi',
        schedule: 'Mon, Wed 17:00-18:30',
      };

      prismaService.term.findFirst.mockResolvedValue({ id: dto.termId });
      prismaService.course.findFirst.mockResolvedValue({ id: dto.courseId });
      prismaService.class.create.mockResolvedValue({
        id: 'new-class-id',
        instituteId: 'inst-1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { enrollments: 0 },
      });

      const result = await service.create(dto, mockAdmin);
      expect(result.id).toBe('new-class-id');
      expect(result.teacherName).toBe('Dr. Ahmadi');
    });

    it('should throw BadRequestException if Branch does not exist', async () => {
      const dto = {
        title: 'Class 101',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        branchId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
        capacity: 15,
        fee: 1500000,
      };

      prismaService.term.findFirst.mockResolvedValue({ id: dto.termId });
      prismaService.course.findFirst.mockResolvedValue({ id: dto.courseId });
      prismaService.branch.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAvailableForStudent', () => {
    it('should return classes matching student allowed level', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: mockStudent.sub,
        currentAllowedCourseId: 'course-level-2',
      });

      prismaService.course.findUnique.mockResolvedValue({
        id: 'course-level-2',
        title: 'Top Notch 2',
      });

      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'class-tn2',
          title: 'Top Notch 2A',
          capacity: 20,
          fee: 1800000,
          _count: { enrollments: 5 },
        },
      ]);

      const result = await service.findAvailableForStudent(mockStudent);
      expect(result.allowedCourseTitle).toBe('Top Notch 2');
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].enrolledCount).toBe(5);
    });
  });
});
