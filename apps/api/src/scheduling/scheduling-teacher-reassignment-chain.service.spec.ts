import {
  DEFAULT_SCHEDULING_SETTINGS,
  SchedulingEngineSettingsSnapshotSchema,
} from '@workspace/types';
import { SchedulingTeacherReassignmentChainService } from './scheduling-teacher-reassignment-chain.service';
import {
  SchedulingTeacherReassignmentValidatorService,
  type TeacherReassignmentAnalysisInput,
} from './scheduling-teacher-reassignment-validator.service';

describe('SchedulingTeacherReassignmentChainService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    targetRequirement: uuid(1),
    ameOne: uuid(2),
    ameFive: uuid(3),
    ameTwo: uuid(15),
    teacherOne: uuid(4),
    teacherTwo: uuid(5),
    teacherThree: uuid(16),
    qualificationOne: uuid(6),
    qualificationTwoAmeOne: uuid(7),
    qualificationTwoAmeFive: uuid(8),
    availabilityOne: uuid(9),
    availabilityTwo: uuid(10),
    proposal: uuid(11),
    roomOne: uuid(12),
    roomTwo: uuid(13),
    term: uuid(14),
    secondProposal: uuid(17),
    qualificationOneAmeTwo: uuid(18),
    qualificationThreeAmeTwo: uuid(19),
  };
  const service = new SchedulingTeacherReassignmentChainService(
    new SchedulingTeacherReassignmentValidatorService(),
  );
  const days = ['SUNDAY', 'TUESDAY', 'THURSDAY'] as const;

  const availability = (id: string) =>
    days.map((dayOfWeek, index) => ({
      id: index === 0 ? id : uuid(100 + index + Number(id.slice(-2))),
      dayOfWeek,
      startTime: '09:00',
      endTime: '12:00',
    }));

  const input = (isLocked = false): TeacherReassignmentAnalysisInput => ({
    requirementId: ids.targetRequirement,
    candidates: [
      {
        key: 'ame-5:teacher-2:sunday:09:00',
        assignmentKey: 'ame-5:teacher-2:sunday:09:00:room-2',
        requirementId: ids.targetRequirement,
        courseId: ids.ameFive,
        branchId: null,
        teacherId: ids.teacherTwo,
        qualificationId: ids.qualificationTwoAmeFive,
        availabilityId: ids.availabilityTwo,
        dayOfWeek: 'SUNDAY' as const,
        startTime: '09:00',
        endTime: '10:30',
        durationMinutes: 90,
        timeGroup: 'ODD_MORNING' as const,
        classroomId: ids.roomTwo,
        deliveryMode: 'IN_PERSON' as const,
        capacity: 12,
      },
    ],
    snapshot: {
      schemaVersion: '1',
      request: {
        termId: ids.term,
        branchId: null,
        requirementIds: [ids.targetRequirement],
        alternativePlanCount: 1,
      },
      term: {
        id: ids.term,
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
      },
      requirements: [
        {
          id: ids.targetRequirement,
          courseId: ids.ameFive,
          branchId: null,
          requiredClassCount: 1,
          capacity: 12,
          sessionDurationMinutes: 90,
          deliveryMode: 'IN_PERSON' as const,
        },
      ],
      teachers: [
        {
          id: ids.qualificationOne,
          courseId: ids.ameOne,
          teacherProfile: {
            userId: ids.teacherOne,
            user: { isActive: true, role: 'TEACHER', branchId: null },
            availabilities: availability(ids.availabilityOne),
          },
        },
        {
          id: ids.qualificationTwoAmeOne,
          courseId: ids.ameOne,
          teacherProfile: {
            userId: ids.teacherTwo,
            user: { isActive: true, role: 'TEACHER', branchId: null },
            availabilities: availability(uuid(20)),
          },
        },
        {
          id: ids.qualificationTwoAmeFive,
          courseId: ids.ameFive,
          teacherProfile: {
            userId: ids.teacherTwo,
            user: { isActive: true, role: 'TEACHER', branchId: null },
            availabilities: availability(ids.availabilityTwo),
          },
        },
      ],
      students: [],
      existingClasses: [],
      classrooms: [
        {
          id: ids.roomOne,
          branchId: null,
          capacity: 12,
          isActive: true,
        },
        {
          id: ids.roomTwo,
          branchId: null,
          capacity: 12,
          isActive: true,
        },
      ],
    },
    settings: SchedulingEngineSettingsSnapshotSchema.parse({
      schemaVersion: '1',
      ...DEFAULT_SCHEDULING_SETTINGS,
    }),
    proposals: [
      {
        id: ids.proposal,
        title: 'AME 1',
        courseId: ids.ameOne,
        branchId: null,
        teacherId: ids.teacherTwo,
        classroomId: ids.roomOne,
        deliveryMode: 'IN_PERSON' as const,
        daysOfWeek: [...days],
        startTime: '09:00',
        endTime: '10:30',
        isLocked,
        classroom: { id: ids.roomOne, name: 'Room 1', capacity: 12 },
      },
    ],
    teacherById: new Map([
      [
        ids.teacherOne,
        { id: ids.teacherOne, firstName: 'Master', lastName: 'One' },
      ],
      [
        ids.teacherTwo,
        { id: ids.teacherTwo, firstName: 'Master', lastName: 'Two' },
      ],
    ]),
    classroomById: new Map([
      [ids.roomOne, { id: ids.roomOne, name: 'Room 1', capacity: 12 }],
      [ids.roomTwo, { id: ids.roomTwo, name: 'Room 2', capacity: 12 }],
    ]),
  });

  it('reassigns the flexible class before assigning the scarce teacher', () => {
    const result = service.analyze(input());

    expect(result).toHaveLength(1);
    expect(result[0]?.targetAssignment.teacher.id).toBe(ids.teacherTwo);
    expect(result[0]?.targetAssignment.classroom?.id).toBe(ids.roomTwo);
    expect(result[0]?.reassignments).toHaveLength(1);
    expect(result[0]?.reassignments[0]).toMatchObject({
      proposalId: ids.proposal,
      classTitle: 'AME 1',
    });
    expect(result[0]?.reassignments[0]?.fromTeacher.id).toBe(ids.teacherTwo);
    expect(result[0]?.reassignments[0]?.toTeacher.id).toBe(ids.teacherOne);
    expect(result[0]?.validation).toEqual({
      allTeachersQualified: true,
      allWithinAvailability: true,
      noTeacherConflicts: true,
      targetClassroomAvailable: true,
    });
  });

  it('does not move a locked class', () => {
    expect(service.analyze(input(true))).toEqual([]);
  });

  it('follows a two-step reassignment chain when the first replacement is busy', () => {
    const analysisInput = input();
    analysisInput.snapshot.teachers.push(
      {
        id: ids.qualificationOneAmeTwo,
        courseId: ids.ameTwo,
        teacherProfile: {
          userId: ids.teacherOne,
          user: { isActive: true, role: 'TEACHER', branchId: null },
          availabilities: availability(uuid(30)),
        },
      },
      {
        id: ids.qualificationThreeAmeTwo,
        courseId: ids.ameTwo,
        teacherProfile: {
          userId: ids.teacherThree,
          user: { isActive: true, role: 'TEACHER', branchId: null },
          availabilities: availability(uuid(40)),
        },
      },
    );
    analysisInput.proposals.push({
      id: ids.secondProposal,
      title: 'AME 2',
      courseId: ids.ameTwo,
      branchId: null,
      teacherId: ids.teacherOne,
      classroomId: null,
      deliveryMode: 'ONLINE',
      daysOfWeek: [...days],
      startTime: '09:00',
      endTime: '10:30',
      isLocked: false,
      classroom: null,
    });
    analysisInput.teacherById.set(ids.teacherThree, {
      id: ids.teacherThree,
      firstName: 'Master',
      lastName: 'Three',
    });

    const result = service.analyze(analysisInput);

    expect(result[0]?.reassignments).toHaveLength(2);
    expect(result[0]?.reassignments[0]?.proposalId).toBe(ids.secondProposal);
    expect(result[0]?.reassignments[0]?.toTeacher.id).toBe(ids.teacherThree);
    expect(result[0]?.reassignments[1]?.proposalId).toBe(ids.proposal);
    expect(result[0]?.reassignments[1]?.toTeacher.id).toBe(ids.teacherOne);
  });
});
