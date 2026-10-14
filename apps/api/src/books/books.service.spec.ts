/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { BookCoursesService } from './book-courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { JwtPayload } from '@workspace/types';

describe('BooksService', () => {
  let service: BooksService;
  let bookCoursesService: BookCoursesService;
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
      book: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      course: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prismaService)),
    };

    i18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        BookCoursesService,
        { provide: PrismaService, useValue: prismaService },
        { provide: I18nService, useValue: i18nService },
        { provide: AuditLogsService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    bookCoursesService = module.get<BookCoursesService>(BookCoursesService);
  });

  describe('findAll', () => {
    it('should return books with coursesCount', async () => {
      prismaService.book.findMany.mockResolvedValue([
        {
          id: 'b-1',
          instituteId: 'inst-1',
          title: 'American English File 1',
          author: 'Oxenden',
          _count: { courses: 3 },
        },
      ]);

      const result = await service.findAll(mockAdmin);
      expect(result).toHaveLength(1);
      expect(result[0].coursesCount).toBe(3);
      expect(result[0].isGlobal).toBe(false);
      expect(prismaService.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ instituteId: null }, { instituteId: 'inst-1' }],
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should throw ConflictException if book title already exists in institute', async () => {
      prismaService.book.findFirst.mockResolvedValue({
        id: 'existing-id',
        title: 'American English File 1',
      });

      await expect(
        service.create({ title: 'American English File 1' }, mockAdmin),
      ).rejects.toThrow(ConflictException);
    });

    it('should create book and return it with coursesCount', async () => {
      prismaService.book.findFirst.mockResolvedValue(null);
      prismaService.book.create.mockResolvedValue({
        id: 'new-b-id',
        title: 'Family and Friends 1',
        author: 'Naomi Simmons',
        publisher: 'OUP',
        description: null,
        coverUrl: null,
        isActive: true,
        instituteId: 'inst-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { courses: 0 },
      });

      const result = await service.create(
        {
          title: 'Family and Friends 1',
          author: 'Naomi Simmons',
          publisher: 'OUP',
        },
        mockAdmin,
      );

      expect(result.id).toBe('new-b-id');
      expect(result.coursesCount).toBe(0);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if trying to update a global book as admin', async () => {
      prismaService.book.findFirstOrThrow.mockResolvedValue({
        id: 'global-b-1',
        instituteId: null,
        title: 'Global Book',
        courses: [],
        _count: { courses: 0 },
      });

      await expect(
        service.update('global-b-1', { title: 'New Title' }, mockAdmin),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if trying to delete a global book as admin', async () => {
      prismaService.book.findFirstOrThrow.mockResolvedValue({
        id: 'global-b-1',
        instituteId: null,
        title: 'Global Book',
        courses: [],
        _count: { courses: 0 },
      });

      await expect(service.remove('global-b-1', mockAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if book has associated courses', async () => {
      prismaService.book.findFirstOrThrow.mockResolvedValue({
        id: 'b-1',
        instituteId: 'inst-1',
        title: 'Book 1',
        courses: [{ id: 'c-1', title: 'Course 1', _count: { classes: 0 } }],
        _count: { courses: 1 },
      });

      await expect(service.remove('b-1', mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should delete book if no associated courses', async () => {
      prismaService.book.findFirstOrThrow.mockResolvedValue({
        id: 'b-1',
        instituteId: 'inst-1',
        title: 'Book 1',
        courses: [],
        _count: { courses: 0 },
      });
      prismaService.book.delete.mockResolvedValue({ id: 'b-1' });

      const result = await service.remove('b-1', mockAdmin);
      expect(result.message).toContain('success');
      expect(prismaService.book.delete).toHaveBeenCalledWith({
        where: { id: 'b-1' },
      });
    });
  });

  describe('generateCourses', () => {
    it('should generate chained courses based on termsCount', async () => {
      prismaService.book.findFirstOrThrow.mockResolvedValue({
        id: 'book-1',
        instituteId: 'inst-1',
        title: 'American English File 1',
      });
      prismaService.course.findFirst.mockResolvedValue(null);

      let callCount = 0;
      prismaService.course.create.mockImplementation((args: any) => {
        callCount++;
        return {
          id: `course-${callCount}`,
          title: args.data.title,
          baseFee: args.data.baseFee,
          prerequisiteId: args.data.prerequisiteId,
          bookId: args.data.bookId,
          instituteId: args.data.instituteId,
          _count: { classes: 0 },
        };
      });

      const result = await service.generateCourses(
        'book-1',
        {
          bookId: 'book-1',
          termsCount: 3,
          baseFee: 1500000,
          namingFormat: 'PART',
        },
        mockAdmin,
        'fa',
      );

      expect(result).toHaveLength(3);
      expect(result[0].prerequisiteId).toBeNull();
      expect(result[1].prerequisiteId).toBe('course-1');
      expect(result[2].prerequisiteId).toBe('course-2');
      expect(result[0].bookId).toBe('book-1');
    });

    it('should throw ConflictException if any generated course title already exists', async () => {
      prismaService.book.findFirstOrThrow.mockResolvedValue({
        id: 'book-1',
        instituteId: 'inst-1',
        title: 'American English File 1',
      });
      prismaService.course.findFirst.mockResolvedValue({
        id: 'c-existing',
        title: 'American English File 1 - بخش ۱',
      });

      await expect(
        service.generateCourses(
          'book-1',
          {
            bookId: 'book-1',
            termsCount: 2,
            baseFee: 1500000,
          },
          mockAdmin,
          'fa',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('generateCoursesBatch', () => {
    it('should generate chained courses for multiple books in a batch', async () => {
      prismaService.book.findMany.mockResolvedValue([
        { id: 'b-1', title: 'Book 1', instituteId: 'inst-1' },
        { id: 'b-2', title: 'Book 2', instituteId: 'inst-1' },
      ]);
      prismaService.course.findFirst.mockResolvedValue(null);

      let callCount = 0;
      prismaService.course.create.mockImplementation((args: any) => {
        callCount++;
        return {
          id: `course-${callCount}`,
          title: args.data.title,
          baseFee: args.data.baseFee,
          prerequisiteId: args.data.prerequisiteId,
          bookId: args.data.bookId,
          instituteId: args.data.instituteId,
          _count: { classes: 0 },
        };
      });

      const result = await service.generateCoursesBatch(
        {
          items: [
            { bookId: 'b-1', termsCount: 2, baseFee: 1000000 },
            { bookId: 'b-2', termsCount: 2, baseFee: 1200000 },
          ],
        },
        mockAdmin,
        'fa',
      );

      expect(result).toHaveLength(4);
      // Book 1 courses
      expect(result[0].title).toBe('Book 1 - 1');
      expect(result[0].prerequisiteId).toBeNull();
      expect(result[1].title).toBe('Book 1 - 2');
      expect(result[1].prerequisiteId).toBe('course-1');

      // Book 2 courses
      expect(result[2].title).toBe('Book 2 - 1');
      expect(result[2].prerequisiteId).toBeNull();
      expect(result[3].title).toBe('Book 2 - 2');
      expect(result[3].prerequisiteId).toBe('course-3');
    });

    it('should throw ConflictException if duplicate titles exist across batch items', async () => {
      prismaService.book.findMany.mockResolvedValue([
        { id: 'b-1', title: 'Book 1', instituteId: 'inst-1' },
      ]);

      await expect(
        service.generateCoursesBatch(
          {
            items: [
              { bookId: 'b-1', termsCount: 2, baseFee: 1000000 },
              { bookId: 'b-1', termsCount: 2, baseFee: 1000000 },
            ],
          },
          mockAdmin,
          'fa',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
