/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
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
        findMany: jest.fn().mockResolvedValue([]),
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
      classroom: {
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

    it('should throw ConflictException if classroom has partial schedule conflict on same days', async () => {
      const dto = {
        title: 'Class New',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        classroomId: 'room-1',
        capacity: 15,
        fee: 1500000,
        daysOfWeek: ['SUNDAY', 'TUESDAY'],
        startTime: '18:20',
        endTime: '19:50',
      };

      prismaService.term.findFirst.mockResolvedValue({ id: dto.termId });
      prismaService.course.findFirst.mockResolvedValue({ id: dto.courseId });
      prismaService.classroom.findFirst.mockResolvedValue({
        id: dto.classroomId,
      });

      // Existing class runs 17:00 - 18:30 on SUNDAY/TUESDAY (10 min overlap with 18:20-19:50)
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'existing-class-1',
          title: 'Existing Class',
          classroomId: 'room-1',
          teacherName: 'Teacher A',
          startTime: '17:00',
          endTime: '18:30',
          daysOfWeek: ['SUNDAY', 'TUESDAY'],
          sessionDates: [],
        },
      ]);

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if teacher has schedule conflict on same days', async () => {
      const dto = {
        title: 'Class New',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        classroomId: 'room-2', // Different room
        teacherName: 'Dr. Ahmadi',
        capacity: 15,
        fee: 1500000,
        daysOfWeek: ['SUNDAY', 'TUESDAY'],
        startTime: '17:00',
        endTime: '18:30',
      };

      prismaService.term.findFirst.mockResolvedValue({ id: dto.termId });
      prismaService.course.findFirst.mockResolvedValue({ id: dto.courseId });
      prismaService.classroom.findFirst.mockResolvedValue({
        id: dto.classroomId,
      });

      // Same teacher teaching in room-1 at the same time
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'existing-class-1',
          title: 'Dr Ahmadi Class 1',
          classroomId: 'room-1',
          teacherName: 'dr. ahmadi', // Case insensitive check
          startTime: '17:00',
          endTime: '18:30',
          daysOfWeek: ['SUNDAY', 'TUESDAY'],
          sessionDates: [],
        },
      ]);

      await expect(service.create(dto, mockAdmin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow class creation if days are different even at the exact same time', async () => {
      const dto = {
        title: 'Class Even Days',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        classroomId: 'room-1',
        teacherName: 'Dr. Ahmadi',
        capacity: 15,
        fee: 1500000,
        daysOfWeek: ['SATURDAY', 'MONDAY', 'WEDNESDAY'], // Even days
        startTime: '17:00',
        endTime: '18:30',
      };

      prismaService.term.findFirst.mockResolvedValue({ id: dto.termId });
      prismaService.course.findFirst.mockResolvedValue({ id: dto.courseId });
      prismaService.classroom.findFirst.mockResolvedValue({
        id: dto.classroomId,
      });

      // Existing class is on Odd days (SUNDAY, TUESDAY)
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'existing-class-1',
          title: 'Class Odd Days',
          classroomId: 'room-1',
          teacherName: 'Dr. Ahmadi',
          startTime: '17:00',
          endTime: '18:30',
          daysOfWeek: ['SUNDAY', 'TUESDAY'],
          sessionDates: [],
        },
      ]);

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
    });

    it('should allow class creation if times are adjacent (no overlap)', async () => {
      const dto = {
        title: 'Adjacent Class',
        termId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        courseId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
        classroomId: 'room-1',
        capacity: 15,
        fee: 1500000,
        daysOfWeek: ['SUNDAY', 'TUESDAY'],
        startTime: '18:30',
        endTime: '20:00',
      };

      prismaService.term.findFirst.mockResolvedValue({ id: dto.termId });
      prismaService.course.findFirst.mockResolvedValue({ id: dto.courseId });
      prismaService.classroom.findFirst.mockResolvedValue({
        id: dto.classroomId,
      });

      // Existing class ends exactly when new class starts (18:30)
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'existing-class-1',
          title: 'First Class',
          classroomId: 'room-1',
          teacherName: 'Other Teacher',
          startTime: '17:00',
          endTime: '18:30',
          daysOfWeek: ['SUNDAY', 'TUESDAY'],
          sessionDates: [],
        },
      ]);

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
    });
  });

  describe('update', () => {
    it('should throw ConflictException if updated schedule collides with another class', async () => {
      const existingClass = {
        id: 'class-to-update',
        instituteId: 'inst-1',
        termId: 'term-1',
        courseId: 'course-1',
        classroomId: 'room-1',
        teacherName: 'Teacher A',
        startTime: '10:00',
        endTime: '11:30',
        daysOfWeek: ['SUNDAY'],
        sessionDates: [],
        _count: { enrollments: 0 },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingClass as any);

      // Attempt to update time to 17:00 - 18:30
      const updateDto = {
        startTime: '17:00',
        endTime: '18:30',
      };

      // Existing another class already booked room-1 at 17:00 - 18:30
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'other-class-1',
          title: 'Other Class',
          classroomId: 'room-1',
          teacherName: 'Teacher B',
          startTime: '17:00',
          endTime: '18:30',
          daysOfWeek: ['SUNDAY'],
          sessionDates: [],
        },
      ]);

      await expect(
        service.update('class-to-update', updateDto, mockAdmin),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully update when there are no conflicts', async () => {
      const existingClass = {
        id: 'class-to-update',
        instituteId: 'inst-1',
        termId: 'term-1',
        courseId: 'course-1',
        classroomId: 'room-1',
        teacherName: 'Teacher A',
        startTime: '10:00',
        endTime: '11:30',
        daysOfWeek: ['SUNDAY'],
        sessionDates: [],
        _count: { enrollments: 0 },
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingClass as any);
      prismaService.class.findMany.mockResolvedValue([]);
      prismaService.class.update.mockResolvedValue({
        ...existingClass,
        title: 'Updated Title',
      });

      const result = await service.update(
        'class-to-update',
        { title: 'Updated Title' },
        mockAdmin,
      );

      expect(result.title).toBe('Updated Title');
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

  describe('checkConflicts', () => {
    it('should return conflict details and conflictingDates when classroom has time overlap', async () => {
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'existing-c1',
          title: 'Existing Class 1',
          classroomId: 'room-1',
          teacherName: 'Other Teacher',
          startTime: '17:00',
          endTime: '18:30',
          daysOfWeek: ['SUNDAY', 'TUESDAY'],
          sessionDates: ['2026-10-04', '2026-10-06'],
        },
      ]);

      const dto = {
        termId: 'term-1',
        classroomId: 'room-1',
        startTime: '18:00',
        endTime: '19:30',
        daysOfWeek: ['SUNDAY', 'TUESDAY'],
        sessionDates: ['2026-10-04', '2026-10-06', '2026-10-11'],
      };

      const result = await service.checkConflicts(dto as any, mockAdmin);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictingDates).toEqual(['2026-10-04', '2026-10-06']);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('CLASSROOM');
      expect(result.conflicts[0].conflictingClassTitle).toBe(
        'Existing Class 1',
      );
    });

    it('should return hasConflict: false when times or days do not overlap', async () => {
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'existing-c1',
          title: 'Existing Class 1',
          classroomId: 'room-1',
          teacherName: 'Other Teacher',
          startTime: '17:00',
          endTime: '18:30',
          daysOfWeek: ['SUNDAY', 'TUESDAY'],
          sessionDates: ['2026-10-04', '2026-10-06'],
        },
      ]);

      const dto = {
        termId: 'term-1',
        classroomId: 'room-1',
        startTime: '18:30', // Adjacent, no overlap
        endTime: '20:00',
        daysOfWeek: ['SUNDAY', 'TUESDAY'],
        sessionDates: ['2026-10-04', '2026-10-06'],
      };

      const result = await service.checkConflicts(dto as any, mockAdmin);
      expect(result.hasConflict).toBe(false);
      expect(result.conflictingDates).toEqual([]);
      expect(result.conflicts).toEqual([]);
    });

    it('should only return classroom conflict when candidate class has both classroom and teacher conflict with the same teacher', async () => {
      prismaService.class.findMany.mockResolvedValue([
        {
          id: 'existing-c1',
          title: 'Existing Class Both',
          classroomId: 'room-1',
          classroom: { id: 'room-1', name: 'Room 101' },
          teacherName: 'Dr. Ahmadi',
          startTime: '17:00',
          endTime: '18:30',
          daysOfWeek: ['SUNDAY', 'TUESDAY'],
          sessionDates: ['2026-10-04', '2026-10-06'],
        },
      ]);

      const dto = {
        termId: 'term-1',
        classroomId: 'room-1',
        teacherName: 'Dr. Ahmadi',
        startTime: '17:00',
        endTime: '18:30',
        daysOfWeek: ['SUNDAY', 'TUESDAY'],
        sessionDates: ['2026-10-04', '2026-10-06'],
      };

      const result = await service.checkConflicts(dto as any, mockAdmin);
      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('CLASSROOM');
      expect(result.conflicts[0].conflictingClassTitle).toBe(
        'Existing Class Both',
      );
    });
  });
});
