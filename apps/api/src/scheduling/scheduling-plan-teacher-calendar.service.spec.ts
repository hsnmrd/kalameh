/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPlanTeacherCalendarService } from './scheduling-plan-teacher-calendar.service';
import { SchedulingTeacherCalendarService } from './scheduling-teacher-calendar.service';

describe('SchedulingPlanTeacherCalendarService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    term: uuid(2),
    requirement: uuid(3),
    course: uuid(4),
    firstTeacher: uuid(5),
    secondTeacher: uuid(6),
    availability: uuid(7),
    proposal: uuid(8),
  };
  const prisma = {
    user: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: ids.firstTeacher,
          firstName: 'Sara',
          lastName: 'Ahmadi',
          teacherProfile: {
            availabilities: [
              {
                id: ids.availability,
                dayOfWeek: 'SUNDAY',
                startTime: '09:00',
                endTime: '12:00',
              },
            ],
            teachableCourses: [
              {
                course: { id: ids.course, title: 'AME 1' },
              },
            ],
          },
        },
        {
          id: ids.secondTeacher,
          firstName: 'Reza',
          lastName: 'Karimi',
          teacherProfile: null,
        },
      ]),
    },
    class: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const service = new SchedulingPlanTeacherCalendarService(
    prisma as unknown as PrismaService,
    new SchedulingTeacherCalendarService(),
  );

  beforeEach(() => jest.clearAllMocks());

  it('builds a calendar for every active teacher, including unqualified teachers', async () => {
    const result = await service.build({
      instituteId: ids.institute,
      inputSnapshot: {
        schemaVersion: '1',
        request: {
          termId: ids.term,
          branchId: null,
          requirementIds: [ids.requirement],
          alternativePlanCount: 1,
        },
        term: {
          id: ids.term,
          startDate: '2026-09-01T00:00:00.000Z',
          endDate: '2026-12-31T00:00:00.000Z',
        },
        requirements: [
          {
            id: ids.requirement,
            courseId: ids.course,
            branchId: null,
            requiredClassCount: 1,
            capacity: 12,
            sessionDurationMinutes: 90,
            deliveryMode: 'ONLINE',
          },
        ],
        teachers: [],
        students: [],
        existingClasses: [],
        classrooms: [],
      },
      proposals: [
        {
          id: ids.proposal,
          title: 'AME 1',
          teacherId: ids.firstTeacher,
          daysOfWeek: ['SUNDAY'],
          startTime: '09:00',
          endTime: '10:30',
        },
      ],
    });

    expect(result).toHaveLength(2);
    expect(
      result.find(({ teacher }) => teacher.id === ids.firstTeacher)
        ?.teachableCourses,
    ).toEqual([{ id: ids.course, title: 'AME 1' }]);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teacher: expect.objectContaining({ id: ids.firstTeacher }),
          slots: expect.arrayContaining([
            expect.objectContaining({
              status: 'BUSY',
              title: 'AME 1',
              startTime: '09:00',
              endTime: '10:30',
            }),
            expect.objectContaining({
              status: 'FREE',
              startTime: '10:30',
              endTime: '12:00',
            }),
          ]),
        }),
        expect.objectContaining({
          teacher: expect.objectContaining({ id: ids.secondTeacher }),
          slots: [],
        }),
      ]),
    );
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          instituteId: ids.institute,
          role: 'TEACHER',
          isActive: true,
        }),
      }),
    );
  });
});
