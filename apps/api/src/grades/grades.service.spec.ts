/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from './grades.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ENROLLMENT_STATUSES, JwtPayload } from '@workspace/types';
import { BadRequestException } from '@nestjs/common';

describe('GradesService', () => {
  let service: GradesService;
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
      class: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
      },
      course: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
      },
      enrollment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prismaService)),
    };

    i18nService = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: prismaService },
        { provide: I18nService, useValue: i18nService },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  describe('getClassStudentsAndGrades', () => {
    it('should query enrollments excluding REJECTED status', async () => {
      const classId = 'class-1';
      prismaService.class.findFirstOrThrow.mockResolvedValue({
        id: classId,
        instituteId: 'inst-1',
      });
      prismaService.enrollment.findMany.mockResolvedValue([
        {
          id: 'enr-1',
          studentId: 'student-1',
          finalScore: 90,
          isPassed: true,
          status: ENROLLMENT_STATUSES.ENROLLED,
          student: {
            id: 'student-1',
            firstName: 'Ali',
            lastName: 'Rezaei',
            phone: '09121111111',
            currentAllowedCourseId: null,
          },
        },
      ]);

      const result = await service.getClassStudentsAndGrades(
        classId,
        mockAdmin,
      );

      expect(prismaService.enrollment.findMany).toHaveBeenCalledWith({
        where: {
          classId,
          status: { not: ENROLLMENT_STATUSES.REJECTED },
        },
        include: expect.any(Object),
        orderBy: { student: { lastName: 'asc' } },
      });
      expect(result).toHaveLength(1);
      expect(result[0].studentId).toBe('student-1');
    });
  });

  describe('submitClassGrades', () => {
    it('should throw BadRequestException if student enrollment is REJECTED', async () => {
      const classId = 'class-1';
      prismaService.class.findFirstOrThrow.mockResolvedValue({
        id: classId,
        instituteId: 'inst-1',
        courseId: 'course-1',
      });
      prismaService.course.findFirst.mockResolvedValue(null);
      prismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-rejected',
        studentId: 'student-1',
        classId,
        status: ENROLLMENT_STATUSES.REJECTED,
      });

      await expect(
        service.submitClassGrades(
          classId,
          {
            grades: [
              { studentId: 'student-1', finalScore: 90, isPassed: true },
            ],
          },
          mockAdmin,
        ),
      ).rejects.toThrow(BadRequestException);
    });
    it('should update grades and auto-upgrade student level on pass', async () => {
      const classId = 'class-1';
      const student1Id = 'student-1';
      const student2Id = 'student-2';

      prismaService.class.findFirstOrThrow.mockResolvedValue({
        id: classId,
        instituteId: 'inst-1',
        courseId: 'course-level-1',
      });

      // Subsequent course in chain (Level 2 requires Level 1)
      prismaService.course.findFirst.mockResolvedValue({
        id: 'course-level-2',
        instituteId: 'inst-1',
        title: 'Level 2',
        prerequisiteId: 'course-level-1',
      });

      prismaService.enrollment.findUnique
        .mockResolvedValueOnce({ id: 'enr-1', studentId: student1Id, classId })
        .mockResolvedValueOnce({ id: 'enr-2', studentId: student2Id, classId });

      const dto = {
        grades: [
          { studentId: student1Id, finalScore: 85, isPassed: true },
          { studentId: student2Id, finalScore: 45, isPassed: false },
        ],
      };

      const result = await service.submitClassGrades(classId, dto, mockAdmin);

      expect(result.updatedCount).toBe(2);

      // Verify Enrollment updates
      expect(prismaService.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enr-1' },
        data: { finalScore: 85, isPassed: true },
      });
      expect(prismaService.enrollment.update).toHaveBeenCalledWith({
        where: { id: 'enr-2' },
        data: { finalScore: 45, isPassed: false },
      });

      // Verify user 1 was upgraded to level 2
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: student1Id, instituteId: 'inst-1' },
        data: { currentAllowedCourseId: 'course-level-2' },
      });

      // Verify user 2 was NOT upgraded
      expect(prismaService.user.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: student2Id } }),
      );
    });
  });

  describe('setStudentLevel', () => {
    it('should manually update student allowed course level', async () => {
      const studentId = 'student-1';
      const targetCourseId = 'target-course-id';

      prismaService.user.findFirstOrThrow.mockResolvedValue({
        id: studentId,
        instituteId: 'inst-1',
      });

      prismaService.course.findFirstOrThrow.mockResolvedValue({
        id: targetCourseId,
        instituteId: 'inst-1',
      });

      const result = await service.setStudentLevel(
        studentId,
        { currentAllowedCourseId: targetCourseId },
        mockAdmin,
      );

      expect(result).toHaveProperty('message');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: studentId, instituteId: 'inst-1' },
        data: { currentAllowedCourseId: targetCourseId },
      });
    });
  });
});
