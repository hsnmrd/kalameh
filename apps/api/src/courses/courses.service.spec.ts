/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { JwtPayload } from '@workspace/types';

describe('CoursesService', () => {
  let service: CoursesService;
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
      course: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    i18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: prismaService },
        { provide: I18nService, useValue: i18nService },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  describe('create', () => {
    it('should throw ConflictException if course title is duplicate', async () => {
      const dto = {
        title: 'Top Notch 1A',
        baseFee: 1500000,
      };

      prismaService.course.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if prerequisite course does not exist', async () => {
      const dto = {
        title: 'Top Notch 1B',
        baseFee: 1500000,
        prerequisiteId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      };

      prismaService.course.findFirst
        .mockResolvedValueOnce(null) // title check
        .mockResolvedValueOnce(null); // prereq check

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create new course successfully', async () => {
      const dto = {
        title: 'Top Notch 1A',
        baseFee: 1500000,
      };

      prismaService.course.findFirst.mockResolvedValue(null);
      prismaService.course.create.mockResolvedValue({
        id: 'new-course-id',
        instituteId: 'inst-1',
        title: 'Top Notch 1A',
        baseFee: 1500000,
        prerequisiteId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0 },
      });

      const result = await service.create(dto, mockAdmin);
      expect(result.id).toBe('new-course-id');
      expect(result.title).toBe('Top Notch 1A');
    });
  });

  describe('update (Cycle Prevention)', () => {
    it('should throw BadRequestException if course sets itself as prerequisite', async () => {
      const courseId = 'course-a';
      prismaService.course.findFirst.mockResolvedValue({
        id: courseId,
        instituteId: 'inst-1',
        title: 'Course A',
        baseFee: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { classes: 0 },
      });

      await expect(
        service.update(courseId, { prerequisiteId: courseId }, mockAdmin),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when circular prerequisite is detected (A -> B -> A)', async () => {
      const courseAId = 'course-a';
      const courseBId = 'course-b';

      // Finding Course A
      prismaService.course.findFirst
        .mockResolvedValueOnce({
          id: courseAId,
          instituteId: 'inst-1',
          title: 'Course A',
          baseFee: 1000,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { classes: 0 },
        })
        .mockResolvedValueOnce({
          id: courseBId,
          instituteId: 'inst-1',
          title: 'Course B',
          prerequisiteId: courseAId, // Course B's prereq is Course A!
        });

      await expect(
        service.update(courseAId, { prerequisiteId: courseBId }, mockAdmin),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
