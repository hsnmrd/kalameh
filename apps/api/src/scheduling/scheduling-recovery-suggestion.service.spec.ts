/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { DEFAULT_SCHEDULING_SETTINGS } from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import { SchedulingRecoverySuggestionService } from './scheduling-recovery-suggestion.service';
import { SchedulingRecoveryOptionBuilderService } from './scheduling-recovery-option-builder.service';
import { SchedulingTeacherCalendarService } from './scheduling-teacher-calendar.service';
import { SchedulingTeacherAvailabilityExpansionService } from './scheduling-teacher-availability-expansion.service';
import { SchedulingTeacherReassignmentChainService } from './scheduling-teacher-reassignment-chain.service';
import { SchedulingTeacherReassignmentValidatorService } from './scheduling-teacher-reassignment-validator.service';
import { SchedulingScheduleWindowService } from './scheduling-schedule-window.service';

describe('SchedulingRecoverySuggestionService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    requirement: uuid(2),
    course: uuid(3),
    teacher: uuid(4),
    qualification: uuid(5),
    availability: uuid(6),
    roomOne: uuid(7),
    roomTwo: uuid(8),
    proposal: uuid(9),
    term: uuid(10),
    otherTeacher: uuid(11),
    thirdTeacher: uuid(12),
    roomOneProposal: uuid(13),
    roomTwoProposal: uuid(14),
  };
  const prisma = {
    user: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { id: ids.teacher, firstName: 'Sara', lastName: 'Ahmadi' },
        ]),
    },
    classroom: {
      findMany: jest.fn().mockResolvedValue([
        { id: ids.roomOne, name: 'Room 1', capacity: 20 },
        { id: ids.roomTwo, name: 'Room 2', capacity: 16 },
      ]),
    },
    class: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    term: {
      findFirst: jest.fn().mockResolvedValue({
        operatingPhase: {
          id: uuid(15),
          title: 'Fall',
          startTime: '09:00',
          endTime: '15:00',
          slotDurationMinutes: 90,
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          hasBreak: false,
          breakStartTime: null,
          breakEndTime: null,
        },
      }),
    },
    course: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const service = new SchedulingRecoverySuggestionService(
    prisma as unknown as PrismaService,
    new SchedulingCandidateSlotService(),
    new SchedulingHardConstraintService(),
    new SchedulingTeacherCalendarService(),
    new SchedulingTeacherAvailabilityExpansionService(
      new SchedulingScheduleWindowService(),
    ),
    new SchedulingRecoveryOptionBuilderService(),
    new SchedulingTeacherReassignmentChainService(
      new SchedulingTeacherReassignmentValidatorService(),
    ),
  );

  beforeEach(() => jest.clearAllMocks());

  it('finds usable rooms without offering a teacher who is already teaching', async () => {
    const analysisRequest = {
      instituteId: ids.institute,
      unresolvedRequirementIds: [ids.requirement],
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
            requiredClassCount: 2,
            capacity: 12,
            sessionDurationMinutes: 90,
            deliveryMode: 'IN_PERSON',
          },
        ],
        teachers: [
          {
            id: ids.qualification,
            courseId: ids.course,
            teacherProfile: {
              userId: ids.teacher,
              user: {
                isActive: true,
                role: 'TEACHER',
                branchId: null,
              },
              availabilities: [
                {
                  id: ids.availability,
                  dayOfWeek: 'SUNDAY',
                  startTime: '09:00',
                  endTime: '13:30',
                },
              ],
            },
          },
        ],
        students: [],
        existingClasses: [],
        classrooms: [
          {
            id: ids.roomOne,
            branchId: null,
            capacity: 20,
            isActive: true,
          },
          {
            id: ids.roomTwo,
            branchId: null,
            capacity: 16,
            isActive: true,
          },
        ],
      },
      settingsSnapshot: {
        schemaVersion: '1',
        ...DEFAULT_SCHEDULING_SETTINGS,
      },
      proposals: [
        {
          id: ids.proposal,
          title: 'A1 class',
          courseId: ids.course,
          branchId: null,
          teacherId: ids.teacher,
          classroomId: ids.roomOne,
          deliveryMode: 'IN_PERSON' as const,
          classroom: { id: ids.roomOne, name: 'Room 1', capacity: 20 },
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '09:00',
          endTime: '10:30',
          isLocked: false,
        },
        {
          id: ids.roomOneProposal,
          title: 'B1 class',
          courseId: ids.course,
          branchId: null,
          teacherId: ids.otherTeacher,
          classroomId: ids.roomOne,
          deliveryMode: 'IN_PERSON' as const,
          classroom: { id: ids.roomOne, name: 'Room 1', capacity: 20 },
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '10:30',
          endTime: '12:00',
          isLocked: false,
        },
        {
          id: ids.roomTwoProposal,
          title: 'B2 class',
          courseId: ids.course,
          branchId: null,
          teacherId: ids.thirdTeacher,
          classroomId: ids.roomTwo,
          deliveryMode: 'IN_PERSON' as const,
          classroom: { id: ids.roomTwo, name: 'Room 2', capacity: 16 },
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '10:30',
          endTime: '12:00',
          isLocked: false,
        },
      ],
    };
    const result = await service.analyze(analysisRequest);

    expect(result[ids.requirement]).toMatchObject({
      qualifiedTeacherCount: 1,
      compatibleClassroomCount: 2,
      teacherCalendars: [
        {
          teacher: { firstName: 'Sara', lastName: 'Ahmadi' },
          slots: expect.arrayContaining([
            expect.objectContaining({
              dayOfWeek: 'SUNDAY',
              startTime: '09:00',
              endTime: '10:30',
              status: 'BUSY',
              title: 'A1 class',
            }),
            expect.objectContaining({
              dayOfWeek: 'SUNDAY',
              startTime: '10:30',
              endTime: '13:30',
              status: 'FREE',
            }),
          ]),
        },
      ],
      reassignmentChains: [],
      staffingFallback: {
        addTeacherSuggested: true,
      },
    });
    expect(
      result[ids.requirement]?.staffingFallback.availabilityOptions[0],
    ).toMatchObject({
      startTime: '12:00',
      endTime: '13:30',
      availableClassrooms: expect.arrayContaining([
        expect.objectContaining({ name: 'Room 1' }),
        expect.objectContaining({ name: 'Room 2' }),
      ]),
    });
    expect(result[ids.requirement]?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'AVAILABLE_NOW',
          startTime: '12:00',
          endTime: '13:30',
          teacher: expect.objectContaining({
            firstName: 'Sara',
            lastName: 'Ahmadi',
          }),
          availableClassrooms: expect.arrayContaining([
            expect.objectContaining({ name: 'Room 1' }),
            expect.objectContaining({ name: 'Room 2' }),
          ]),
        }),
        expect.objectContaining({
          status: 'REQUIRES_PLAN_CHANGE',
          startTime: '10:30',
          availableClassrooms: [],
          blockingClasses: expect.arrayContaining([
            expect.objectContaining({
              id: ids.roomOneProposal,
              title: 'B1 class',
              conflictTypes: ['CLASSROOM'],
              classroom: expect.objectContaining({ name: 'Room 1' }),
            }),
            expect.objectContaining({
              id: ids.roomTwoProposal,
              title: 'B2 class',
              conflictTypes: ['CLASSROOM'],
              classroom: expect.objectContaining({ name: 'Room 2' }),
            }),
          ]),
        }),
      ]),
    );
    expect(result[ids.requirement]?.options).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ startTime: '09:00' })]),
    );
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: ids.institute }),
      }),
    );
    const teacherConflictResult = await service.analyze({
      ...analysisRequest,
      proposals: [
        {
          id: ids.proposal,
          title: 'A1 class',
          courseId: ids.course,
          branchId: null,
          teacherId: ids.teacher,
          classroomId: ids.roomOne,
          deliveryMode: 'IN_PERSON' as const,
          classroom: { id: ids.roomOne, name: 'Room 1', capacity: 20 },
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '09:00',
          endTime: '13:30',
          isLocked: false,
        },
      ],
    });

    expect(teacherConflictResult[ids.requirement]).toMatchObject({
      options: [],
      totalOptionCount: 0,
      busyTeachers: [
        { id: ids.teacher, firstName: 'Sara', lastName: 'Ahmadi' },
      ],
      staffingFallback: {
        addTeacherSuggested: true,
        availabilityOptions: [
          expect.objectContaining({
            startTime: '13:30',
            endTime: '15:00',
            teacher: {
              id: ids.teacher,
              firstName: 'Sara',
              lastName: 'Ahmadi',
            },
            availabilityChangeDays: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
            availableClassrooms: expect.arrayContaining([
              { id: ids.roomOne, name: 'Room 1', capacity: 20 },
              { id: ids.roomTwo, name: 'Room 2', capacity: 16 },
            ]),
          }),
        ],
      },
    });
    expect(
      teacherConflictResult[ids.requirement]?.staffingFallback
        .availabilityOptions,
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          startTime: expect.stringMatching(/^(09:00|10:30|12:00)$/),
        }),
      ]),
    );

    prisma.classroom.findMany.mockResolvedValueOnce([]);
    const noRoomResult = await service.analyze({
      ...analysisRequest,
      proposals: [
        {
          id: ids.proposal,
          title: 'A1 class',
          courseId: ids.course,
          branchId: null,
          teacherId: ids.teacher,
          classroomId: ids.roomOne,
          deliveryMode: 'IN_PERSON' as const,
          classroom: { id: ids.roomOne, name: 'Room 1', capacity: 20 },
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '09:00',
          endTime: '13:30',
          isLocked: false,
        },
      ],
    });

    expect(
      noRoomResult[ids.requirement]?.staffingFallback.availabilityOptions,
    ).toEqual([]);
  });

  it('suggests a free higher-level teacher when an unresolved class has a lower course level', async () => {
    const lowerCourseId = uuid(20);
    const higherCourseId = uuid(21);
    const higherTeacherId = uuid(22);

    prisma.user.findMany.mockResolvedValueOnce([
      { id: higherTeacherId, firstName: 'نیلوفر', lastName: 'صادقی' },
    ]);
    prisma.course.findMany.mockResolvedValueOnce([
      { id: lowerCourseId, title: 'AME ۲-۲', prerequisiteId: null },
      { id: higherCourseId, title: 'AME ۳-۱', prerequisiteId: lowerCourseId },
    ]);

    const result = await service.analyze({
      instituteId: ids.institute,
      unresolvedRequirementIds: [ids.requirement],
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
            courseId: lowerCourseId,
            branchId: null,
            requiredClassCount: 1,
            capacity: 12,
            sessionDurationMinutes: 90,
            deliveryMode: 'IN_PERSON',
          },
        ],
        teachers: [
          {
            id: uuid(23),
            courseId: higherCourseId,
            teacherProfile: {
              userId: higherTeacherId,
              user: {
                isActive: true,
                role: 'TEACHER',
                branchId: null,
              },
              availabilities: [
                {
                  id: uuid(24),
                  dayOfWeek: 'SUNDAY',
                  startTime: '10:30',
                  endTime: '12:00',
                },
                {
                  id: uuid(25),
                  dayOfWeek: 'TUESDAY',
                  startTime: '10:30',
                  endTime: '12:00',
                },
                {
                  id: uuid(26),
                  dayOfWeek: 'THURSDAY',
                  startTime: '10:30',
                  endTime: '12:00',
                },
              ],
            },
          },
        ],
        students: [],
        existingClasses: [],
        classrooms: [
          {
            id: ids.roomOne,
            branchId: null,
            capacity: 20,
            isActive: true,
          },
        ],
      },
      settingsSnapshot: {
        schemaVersion: '1',
        ...DEFAULT_SCHEDULING_SETTINGS,
      },
      proposals: [],
    });

    expect(
      result[ids.requirement]?.staffingFallback.availabilityOptions[0],
    ).toMatchObject({
      startTime: '10:30',
      endTime: '12:00',
      daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
      availabilityChangeDays: [],
      higherLevelCourseTitle: 'AME ۳-۱',
      teacher: {
        id: higherTeacherId,
        firstName: 'نیلوفر',
        lastName: 'صادقی',
      },
    });
  });
});
