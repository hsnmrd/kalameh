/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { DEFAULT_SCHEDULING_SETTINGS } from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import { SchedulingRecoverySuggestionService } from './scheduling-recovery-suggestion.service';

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
  };
  const service = new SchedulingRecoverySuggestionService(
    prisma as unknown as PrismaService,
    new SchedulingCandidateSlotService(),
    new SchedulingHardConstraintService(),
  );

  beforeEach(() => jest.clearAllMocks());

  it('finds immediately usable slots and explains plan changes with empty rooms', async () => {
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
          teacherId: ids.teacher,
          classroomId: ids.roomOne,
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          startTime: '09:00',
          endTime: '10:30',
        },
      ],
    });

    expect(result[ids.requirement]).toMatchObject({
      qualifiedTeacherCount: 1,
      compatibleClassroomCount: 2,
    });
    expect(result[ids.requirement]?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'AVAILABLE_NOW',
          startTime: '10:30',
          endTime: '12:00',
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
          startTime: '09:00',
          availableClassrooms: [
            expect.objectContaining({ id: ids.roomTwo, name: 'Room 2' }),
          ],
          blockingClasses: [
            expect.objectContaining({
              id: ids.proposal,
              title: 'A1 class',
              conflictTypes: ['TEACHER', 'CLASSROOM'],
            }),
          ],
        }),
      ]),
    );
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: ids.institute }),
      }),
    );
  });
});
