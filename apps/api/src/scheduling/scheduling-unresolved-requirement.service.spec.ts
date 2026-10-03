import type {
  SchedulingCandidateRejection,
  SchedulingFeasibleCandidate,
} from '@workspace/types';
import { SchedulingUnresolvedRequirementService } from './scheduling-unresolved-requirement.service';

describe('MVP-021 SchedulingUnresolvedRequirementService', () => {
  const ids = {
    requirement: '00000000-0000-4000-8000-000000000001',
    course: '00000000-0000-4000-8000-000000000002',
    teacher: '00000000-0000-4000-8000-000000000003',
    qualification: '00000000-0000-4000-8000-000000000004',
    availability: '00000000-0000-4000-8000-000000000005',
  };

  const feasible = (suffix: string): SchedulingFeasibleCandidate => ({
    key: `candidate-${suffix}`,
    assignmentKey: `candidate-${suffix}:ONLINE`,
    requirementId: ids.requirement,
    courseId: ids.course,
    branchId: null,
    teacherId: ids.teacher,
    qualificationId: ids.qualification,
    availabilityId: ids.availability,
    classroomId: null,
    deliveryMode: 'ONLINE',
    capacity: 12,
    dayOfWeek: suffix === '2' ? 'TUESDAY' : 'SUNDAY',
    startTime: '09:00',
    endTime: '10:30',
    durationMinutes: 90,
    timeGroup: 'ODD_MORNING',
  });
  const rejection = (
    reasonCode: SchedulingCandidateRejection['reasonCodes'][number],
  ): SchedulingCandidateRejection => ({
    candidate: feasible('rejected'),
    reasonCodes: [reasonCode],
    context: {},
  });
  const baseInput = {
    requirements: [
      { id: ids.requirement, courseId: ids.course, requiredClassCount: 2 },
    ],
    selectedAssignments: [],
    feasibleAssignments: [] as SchedulingFeasibleCandidate[],
    rejectedCandidates: [] as SchedulingCandidateRejection[],
    preflightIssues: [],
  };
  let service: SchedulingUnresolvedRequirementService;

  beforeEach(() => {
    service = new SchedulingUnresolvedRequirementService();
  });

  it('omits a fully satisfied requirement', () => {
    const candidates = [feasible('1'), feasible('2')];
    const result = service.evaluate({
      ...baseInput,
      feasibleAssignments: candidates,
      selectedAssignments: candidates.map((candidate) => ({
        assignmentKey: candidate.assignmentKey,
        requirementId: ids.requirement,
      })),
    });

    expect(result.items).toEqual([]);
    expect(result.summary).toEqual({
      requiredClassCount: 2,
      scheduledClassCount: 2,
      missingClassCount: 0,
      unresolvedRequirementCount: 0,
    });
  });

  it('maps a blocking preflight issue to a stable root reason', () => {
    const result = service.evaluate({
      ...baseInput,
      preflightIssues: [
        {
          code: 'COURSE_WITHOUT_QUALIFIED_TEACHER',
          severity: 'BLOCKING',
          scope: 'COURSE',
          entityId: ids.course,
          context: {},
        },
      ],
    });

    expect(result.items[0]).toMatchObject({
      classRequirementId: ids.requirement,
      reasonCode: 'NO_QUALIFIED_TEACHER',
      missingClassCount: 2,
    });
  });

  it('maps hard-constraint rejection reasons', () => {
    const result = service.evaluate({
      ...baseInput,
      rejectedCandidates: [rejection('TEACHER_TIME_CONFLICT')],
    });

    expect(result.items[0]?.reasonCode).toBe('TEACHER_TIME_CONFLICT');
    expect(result.items[0]?.details).toMatchObject({
      sourceCodes: ['TEACHER_TIME_CONFLICT'],
    });
  });

  it('uses deterministic priority when several root causes exist', () => {
    const result = service.evaluate({
      ...baseInput,
      rejectedCandidates: [
        rejection('CLASSROOM_TIME_CONFLICT'),
        rejection('OUTSIDE_TEACHER_AVAILABILITY'),
      ],
    });

    expect(result.items[0]?.reasonCode).toBe('NO_TEACHER_AVAILABILITY');
  });

  it('distinguishes insufficient candidates from combination conflicts', () => {
    const insufficient = service.evaluate({
      ...baseInput,
      feasibleAssignments: [feasible('1')],
    });
    expect(insufficient.items[0]?.reasonCode).toBe(
      'INSUFFICIENT_FEASIBLE_CANDIDATES',
    );

    const enoughButUnselected = service.evaluate({
      ...baseInput,
      feasibleAssignments: [feasible('1'), feasible('2')],
    });
    expect(enoughButUnselected.items[0]?.reasonCode).toBe(
      'PLAN_COMBINATION_CONFLICT',
    );
  });

  it('falls back to no feasible slot when no evidence exists', () => {
    const result = service.evaluate(baseInput);

    expect(result.items[0]?.reasonCode).toBe('NO_FEASIBLE_TIME_SLOT');
    expect(result.summary.missingClassCount).toBe(2);
  });

  it('rejects selected assignments that are not feasible for the requirement', () => {
    expect(() =>
      service.evaluate({
        ...baseInput,
        selectedAssignments: [
          {
            assignmentKey: 'unknown-assignment',
            requirementId: ids.requirement,
          },
        ],
      }),
    ).toThrow('selected assignment must be feasible for its requirement');
  });

  it('rejects a feasible assignment attributed to another requirement', () => {
    const candidate = feasible('1');

    expect(() =>
      service.evaluate({
        ...baseInput,
        requirements: [
          ...baseInput.requirements,
          {
            id: '00000000-0000-4000-8000-000000000006',
            courseId: '00000000-0000-4000-8000-000000000007',
            requiredClassCount: 1,
          },
        ],
        feasibleAssignments: [candidate],
        selectedAssignments: [
          {
            assignmentKey: candidate.assignmentKey,
            requirementId: '00000000-0000-4000-8000-000000000006',
          },
        ],
      }),
    ).toThrow('selected assignment must be feasible for its requirement');
  });
});
