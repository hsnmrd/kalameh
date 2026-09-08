import type { SchedulingCandidateSlot } from '@workspace/types';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';

describe('MVP-018 SchedulingHardConstraintService', () => {
  const ids = {
    requirement: '00000000-0000-4000-8000-000000000001',
    course: '00000000-0000-4000-8000-000000000002',
    teacher: '00000000-0000-4000-8000-000000000003',
    qualification: '00000000-0000-4000-8000-000000000004',
    availability: '00000000-0000-4000-8000-000000000005',
    branch: '00000000-0000-4000-8000-000000000006',
    classroom: '00000000-0000-4000-8000-000000000007',
    secondClassroom: '00000000-0000-4000-8000-000000000008',
    existingClass: '00000000-0000-4000-8000-000000000009',
  };
  const candidate: SchedulingCandidateSlot = {
    key: 'candidate-1',
    requirementId: ids.requirement,
    courseId: ids.course,
    branchId: ids.branch,
    teacherId: ids.teacher,
    qualificationId: ids.qualification,
    availabilityId: ids.availability,
    dayOfWeek: 'SUNDAY',
    startTime: '09:00',
    endTime: '10:30',
    durationMinutes: 90,
    timeGroup: 'ODD_MORNING',
  };
  const baseInput = {
    candidates: [candidate],
    requirements: [
      {
        id: ids.requirement,
        courseId: ids.course,
        branchId: ids.branch,
        capacity: 12,
        sessionDurationMinutes: 90,
        deliveryMode: 'IN_PERSON' as const,
      },
    ],
    qualifications: [
      {
        id: ids.qualification,
        courseId: ids.course,
        teacherProfile: {
          userId: ids.teacher,
          user: {
            isActive: true,
            role: 'TEACHER',
            branchId: ids.branch,
          },
          availabilities: [
            {
              id: ids.availability,
              dayOfWeek: 'SUNDAY',
              startTime: '08:00',
              endTime: '12:00',
            },
          ],
        },
      },
    ],
    classrooms: [
      {
        id: ids.classroom,
        branchId: ids.branch,
        capacity: 20,
        isActive: true,
      },
    ],
    existingClasses: [],
  };
  let service: SchedulingHardConstraintService;

  beforeEach(() => {
    service = new SchedulingHardConstraintService();
  });

  it('accepts a qualified available teacher and compatible classroom', () => {
    const result = service.evaluate(baseInput);

    expect(result.rejected).toEqual([]);
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({
      classroomId: ids.classroom,
      deliveryMode: 'IN_PERSON',
      capacity: 12,
    });
  });

  it('rejects teacher overlaps but allows adjacent half-open intervals', () => {
    const existingClass = {
      id: ids.existingClass,
      teacherId: ids.teacher,
      classroomId: null,
      daysOfWeek: ['SUNDAY'],
      sessionDates: [],
      startTime: '10:00',
      endTime: '11:00',
    };

    const conflict = service.evaluate({
      ...baseInput,
      existingClasses: [existingClass],
    });
    expect(conflict.rejected[0]?.reasonCodes).toEqual([
      'TEACHER_TIME_CONFLICT',
    ]);

    const adjacent = service.evaluate({
      ...baseInput,
      existingClasses: [
        { ...existingClass, startTime: '10:30', endTime: '11:30' },
      ],
    });
    expect(adjacent.accepted).toHaveLength(1);
  });

  it('uses structured session dates when checking recurring day conflicts', () => {
    const result = service.evaluate({
      ...baseInput,
      existingClasses: [
        {
          id: ids.existingClass,
          teacherId: ids.teacher,
          classroomId: null,
          daysOfWeek: [],
          sessionDates: ['2026-09-13'],
          startTime: '09:30',
          endTime: '10:00',
        },
      ],
    });

    expect(result.rejected[0]?.reasonCodes).toEqual(['TEACHER_TIME_CONFLICT']);
  });

  it('keeps free rooms and removes rooms with a schedule conflict', () => {
    const result = service.evaluate({
      ...baseInput,
      classrooms: [
        ...baseInput.classrooms,
        {
          id: ids.secondClassroom,
          branchId: ids.branch,
          capacity: 20,
          isActive: true,
        },
      ],
      existingClasses: [
        {
          id: ids.existingClass,
          teacherId: null,
          classroomId: ids.classroom,
          daysOfWeek: ['SUNDAY'],
          sessionDates: [],
          startTime: '09:30',
          endTime: '10:00',
        },
      ],
    });

    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]?.classroomId).toBe(ids.secondClassroom);
  });

  it('distinguishes location, capacity, and room-conflict rejection reasons', () => {
    const invalidLocation = service.evaluate({
      ...baseInput,
      classrooms: [],
    });
    expect(invalidLocation.rejected[0]?.reasonCodes).toEqual([
      'INVALID_DELIVERY_LOCATION',
    ]);

    const insufficientCapacity = service.evaluate({
      ...baseInput,
      classrooms: [{ ...baseInput.classrooms[0], capacity: 8 }],
    });
    expect(insufficientCapacity.rejected[0]?.reasonCodes).toEqual([
      'INSUFFICIENT_CLASSROOM_CAPACITY',
    ]);

    const roomConflict = service.evaluate({
      ...baseInput,
      existingClasses: [
        {
          id: ids.existingClass,
          teacherId: null,
          classroomId: ids.classroom,
          daysOfWeek: ['SUNDAY'],
          sessionDates: [],
          startTime: '09:00',
          endTime: '10:30',
        },
      ],
    });
    expect(roomConflict.rejected[0]?.reasonCodes).toEqual([
      'CLASSROOM_TIME_CONFLICT',
    ]);
  });

  it('accepts online candidates without allocating a classroom', () => {
    const result = service.evaluate({
      ...baseInput,
      requirements: [
        { ...baseInput.requirements[0], deliveryMode: 'ONLINE' as const },
      ],
      classrooms: [],
    });

    expect(result.accepted[0]).toMatchObject({
      classroomId: null,
      deliveryMode: 'ONLINE',
    });
  });

  it('rejects stale qualification and availability references', () => {
    const invalidQualification = service.evaluate({
      ...baseInput,
      qualifications: [],
    });
    expect(invalidQualification.rejected[0]?.reasonCodes).toEqual([
      'TEACHER_NOT_QUALIFIED',
    ]);

    const invalidAvailability = service.evaluate({
      ...baseInput,
      qualifications: [
        {
          ...baseInput.qualifications[0],
          teacherProfile: {
            ...baseInput.qualifications[0].teacherProfile,
            availabilities: [],
          },
        },
      ],
    });
    expect(invalidAvailability.rejected[0]?.reasonCodes).toEqual([
      'OUTSIDE_TEACHER_AVAILABILITY',
    ]);
  });

  it('rejects an inactive, non-teacher, or cross-branch teacher', () => {
    const result = service.evaluate({
      ...baseInput,
      qualifications: [
        {
          ...baseInput.qualifications[0],
          teacherProfile: {
            ...baseInput.qualifications[0].teacherProfile,
            user: {
              ...baseInput.qualifications[0].teacherProfile.user,
              isActive: false,
            },
          },
        },
      ],
    });

    expect(result.rejected[0]?.reasonCodes).toEqual(['INVALID_TEACHER']);
  });
});
