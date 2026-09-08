import { SchedulingPreflightService } from './scheduling-preflight.service';

describe('MVP-016 SchedulingPreflightService', () => {
  const courseId = '00000000-0000-4000-8000-000000000001';
  const requirementId = '00000000-0000-4000-8000-000000000002';
  const teacherId = '00000000-0000-4000-8000-000000000003';
  const baseInput = {
    checkedAt: new Date('2026-09-08T10:00:00.000Z'),
    requirements: [
      {
        id: requirementId,
        courseId,
        capacity: 12,
        deliveryMode: 'IN_PERSON' as const,
      },
    ],
    teachers: [
      {
        courseId,
        teacherProfile: {
          userId: teacherId,
          user: { isActive: true },
          availabilities: [{ dayOfWeek: 'SATURDAY' }],
        },
      },
    ],
    students: [{ studentProfile: { scheduleStatus: 'COMPLETE' as const } }],
    classrooms: [{ id: requirementId, capacity: 20 }],
    activeTeachers: [
      {
        id: teacherId,
        teacherProfile: { teachableCourses: [{ id: courseId }] },
      },
    ],
  };
  let service: SchedulingPreflightService;

  beforeEach(() => {
    service = new SchedulingPreflightService();
  });

  it('passes when each course has an available qualified teacher', () => {
    const report = service.evaluate(baseInput);

    expect(report.passed).toBe(true);
    expect(report.summary).toMatchObject({
      blockingIssueCount: 0,
      requirementCount: 1,
      courseCount: 1,
      completeStudentScheduleCount: 1,
    });
  });

  it('blocks a course without a qualified teacher', () => {
    const report = service.evaluate({ ...baseInput, teachers: [] });

    expect(report.passed).toBe(false);
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'COURSE_WITHOUT_QUALIFIED_TEACHER',
        severity: 'BLOCKING',
        entityId: courseId,
      }),
    );
  });

  it('blocks qualified teachers with no registered availability', () => {
    const report = service.evaluate({
      ...baseInput,
      teachers: [
        {
          ...baseInput.teachers[0],
          teacherProfile: {
            ...baseInput.teachers[0].teacherProfile,
            availabilities: [],
          },
        },
      ],
    });

    expect(report.passed).toBe(false);
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'COURSE_WITHOUT_AVAILABLE_TEACHER',
        severity: 'BLOCKING',
      }),
    );
  });

  it('reports partial classroom and student data as non-blocking warnings', () => {
    const report = service.evaluate({
      ...baseInput,
      students: [{ studentProfile: { scheduleStatus: 'INCOMPLETE' as const } }],
      classrooms: [{ id: requirementId, capacity: 8 }],
    });

    expect(report.passed).toBe(true);
    expect(report.summary.warningCount).toBe(2);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      'NO_CLASSROOM_WITH_REQUIRED_CAPACITY',
      'INCOMPLETE_STUDENT_SCHEDULE_DATA',
    ]);
  });
});
