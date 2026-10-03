import type { SchedulingFeasibleCandidate } from '@workspace/types';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';

describe('MVP-019 SchedulingStudentCoverageService', () => {
  const ids = {
    requirement: '00000000-0000-4000-8000-000000000001',
    course: '00000000-0000-4000-8000-000000000002',
    emptyCourse: '00000000-0000-4000-8000-000000000003',
    teacher: '00000000-0000-4000-8000-000000000004',
    qualification: '00000000-0000-4000-8000-000000000005',
    availability: '00000000-0000-4000-8000-000000000006',
    classroom: '00000000-0000-4000-8000-000000000007',
    studentOne: '00000000-0000-4000-8000-000000000008',
    studentTwo: '00000000-0000-4000-8000-000000000009',
    studentThree: '00000000-0000-4000-8000-000000000010',
  };
  const candidate: SchedulingFeasibleCandidate = {
    key: 'candidate-1',
    assignmentKey: 'candidate-1:classroom',
    requirementId: ids.requirement,
    courseId: ids.course,
    branchId: null,
    teacherId: ids.teacher,
    qualificationId: ids.qualification,
    availabilityId: ids.availability,
    classroomId: ids.classroom,
    deliveryMode: 'IN_PERSON',
    capacity: 12,
    dayOfWeek: 'SUNDAY',
    startTime: '09:00',
    endTime: '10:30',
    durationMinutes: 90,
    timeGroup: 'ODD_MORNING',
  };
  const baseInput = {
    candidates: [candidate],
    courseIds: [ids.course, ids.emptyCourse],
    termStartDate: '2026-09-01',
    termEndDate: '2026-12-31',
    students: [
      {
        id: ids.studentOne,
        currentAllowedCourseId: ids.course,
        studentProfile: {
          scheduleStatus: 'COMPLETE' as const,
          timeConstraints: [
            {
              kind: 'UNAVAILABLE' as const,
              dayOfWeek: 'SUNDAY',
              startTime: '09:30',
              endTime: '11:00',
              effectiveFrom: null,
              effectiveUntil: null,
            },
          ],
        },
      },
      {
        id: ids.studentTwo,
        currentAllowedCourseId: ids.course,
        studentProfile: {
          scheduleStatus: 'COMPLETE' as const,
          timeConstraints: [
            {
              kind: 'PREFERRED' as const,
              dayOfWeek: 'SUNDAY',
              startTime: '09:00',
              endTime: '10:30',
            },
          ],
        },
      },
      {
        id: ids.studentThree,
        currentAllowedCourseId: ids.course,
        studentProfile: {
          scheduleStatus: 'INCOMPLETE' as const,
          timeConstraints: [],
        },
      },
    ],
  };
  let service: SchedulingStudentCoverageService;

  beforeEach(() => {
    service = new SchedulingStudentCoverageService();
  });

  it('counts unique complete students and excludes unavailable students', () => {
    const result = service.evaluate(baseInput);
    const coverage = result.candidates[0];

    expect(coverage).toMatchObject({
      status: 'APPLICABLE',
      knownStudentCount: 2,
      unknownStudentCount: 1,
      coveragePercent: 50,
      coveredStudentIds: [ids.studentTwo],
      uncoveredStudentIds: [ids.studentOne],
    });
    expect(result.summary).toMatchObject({
      studentCount: 3,
      knownStudentCount: 2,
      unknownStudentCount: 1,
    });
  });

  it('does not treat preferred periods as unavailability', () => {
    const result = service.evaluate({
      ...baseInput,
      students: [baseInput.students[1]],
    });

    expect(result.candidates[0]?.coveredStudentIds).toEqual([ids.studentTwo]);
    expect(result.candidates[0]?.coveragePercent).toBe(100);
  });

  it('uses half-open overlap and permits a constraint ending at class start', () => {
    const result = service.evaluate({
      ...baseInput,
      students: [
        {
          ...baseInput.students[0],
          studentProfile: {
            scheduleStatus: 'COMPLETE' as const,
            timeConstraints: [
              {
                kind: 'UNAVAILABLE' as const,
                dayOfWeek: 'SUNDAY',
                startTime: '08:00',
                endTime: '09:00',
              },
            ],
          },
        },
      ],
    });

    expect(result.candidates[0]?.coveragePercent).toBe(100);
  });

  it('ignores constraints outside the term effective range', () => {
    const result = service.evaluate({
      ...baseInput,
      students: [
        {
          ...baseInput.students[0],
          studentProfile: {
            scheduleStatus: 'COMPLETE' as const,
            timeConstraints: [
              {
                kind: 'UNAVAILABLE' as const,
                dayOfWeek: 'SUNDAY',
                startTime: '09:00',
                endTime: '10:30',
                effectiveUntil: '2026-08-31',
              },
            ],
          },
        },
      ],
    });

    expect(result.candidates[0]?.coveragePercent).toBe(100);
  });

  it('returns NOT_APPLICABLE instead of zero without known schedules', () => {
    const result = service.evaluate({
      ...baseInput,
      students: [baseInput.students[2]],
    });

    expect(result.candidates[0]).toMatchObject({
      status: 'NOT_APPLICABLE',
      knownStudentCount: 0,
      coveragePercent: null,
    });
    expect(result.courses[0]?.bestCoveragePercent).toBeNull();
  });

  it('reports requested courses that have no feasible candidate', () => {
    const result = service.evaluate(baseInput);
    const emptyCourse = result.courses.find(
      (course) => course.courseId === ids.emptyCourse,
    );

    expect(emptyCourse).toMatchObject({
      candidateCount: 0,
      status: 'NOT_APPLICABLE',
      bestCoveragePercent: null,
    });
  });

  it('rejects an invalid term date range', () => {
    expect(() =>
      service.evaluate({
        ...baseInput,
        termStartDate: '2027-01-01',
        termEndDate: '2026-01-01',
      }),
    ).toThrow(RangeError);
  });
});
