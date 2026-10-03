import { Injectable } from '@nestjs/common';
import {
  SchedulingUnresolvedEvaluationSchema,
  type SchedulingCandidateRejection,
  type SchedulingFeasibleCandidate,
  type SchedulingPreflightIssue,
  type SchedulingUnresolvedEvaluation,
  type SchedulingUnresolvedReasonCode,
} from '@workspace/types';

type UnresolvedRequirement = {
  id: string;
  courseId: string;
  requiredClassCount: number;
};

type SelectedAssignment = {
  assignmentKey: string;
  requirementId: string;
};

export type EvaluateUnresolvedRequirementsInput = {
  requirements: UnresolvedRequirement[];
  selectedAssignments: SelectedAssignment[];
  feasibleAssignments: SchedulingFeasibleCandidate[];
  rejectedCandidates: SchedulingCandidateRejection[];
  preflightIssues?: SchedulingPreflightIssue[];
};

const REASON_PRIORITY: SchedulingUnresolvedReasonCode[] = [
  'INVALID_REQUIREMENT',
  'NO_VALID_TEACHER',
  'NO_QUALIFIED_TEACHER',
  'NO_TEACHER_AVAILABILITY',
  'TEACHER_TIME_CONFLICT',
  'NO_COMPATIBLE_CLASSROOM',
  'INSUFFICIENT_CLASSROOM_CAPACITY',
  'CLASSROOM_TIME_CONFLICT',
  'NO_FEASIBLE_TIME_SLOT',
  'INSUFFICIENT_FEASIBLE_CANDIDATES',
  'PLAN_COMBINATION_CONFLICT',
];

@Injectable()
export class SchedulingUnresolvedRequirementService {
  evaluate(
    input: EvaluateUnresolvedRequirementsInput,
  ): SchedulingUnresolvedEvaluation {
    const requirements = [...input.requirements].sort((left, right) =>
      left.id.localeCompare(right.id),
    );
    const requirementIds = new Set(requirements.map(({ id }) => id));
    const feasibleAssignmentRequirements = new Map(
      input.feasibleAssignments.map((candidate) => [
        candidate.assignmentKey,
        candidate.requirementId,
      ]),
    );
    if (
      input.selectedAssignments.some(
        (assignment) =>
          !requirementIds.has(assignment.requirementId) ||
          feasibleAssignmentRequirements.get(assignment.assignmentKey) !==
            assignment.requirementId,
      )
    ) {
      throw new RangeError(
        'selected assignment must be feasible for its requirement',
      );
    }
    const items = requirements.flatMap((requirement) => {
      if (
        !Number.isInteger(requirement.requiredClassCount) ||
        requirement.requiredClassCount < 1
      ) {
        throw new RangeError('required class count must be a positive integer');
      }

      const selectedCount = new Set(
        input.selectedAssignments
          .filter((assignment) => assignment.requirementId === requirement.id)
          .map((assignment) => assignment.assignmentKey),
      ).size;
      if (selectedCount > requirement.requiredClassCount) {
        throw new RangeError('scheduled classes cannot exceed requirement');
      }
      const missingClassCount = requirement.requiredClassCount - selectedCount;
      if (missingClassCount === 0) return [];

      const feasibleCandidateCount = new Set(
        input.feasibleAssignments
          .filter((candidate) => candidate.requirementId === requirement.id)
          .map((candidate) => candidate.key),
      ).size;
      const rejectionCodes = input.rejectedCandidates
        .filter(({ candidate }) => candidate.requirementId === requirement.id)
        .flatMap((rejection) => rejection.reasonCodes);
      const preflightCodes = (input.preflightIssues ?? [])
        .filter(
          (issue) =>
            issue.entityId === requirement.id ||
            issue.entityId === requirement.courseId,
        )
        .map((issue) => issue.code);
      const mappedReasons = [
        ...preflightCodes.map((code) => this.mapPreflightReason(code)),
        ...rejectionCodes.map((code) => this.mapHardConstraintReason(code)),
      ].filter(
        (reason): reason is SchedulingUnresolvedReasonCode => reason !== null,
      );
      const reasonCode = this.resolveReason(
        mappedReasons,
        feasibleCandidateCount,
        requirement.requiredClassCount,
      );

      return [
        {
          classRequirementId: requirement.id,
          reasonCode,
          missingClassCount,
          details: {
            requiredClassCount: requirement.requiredClassCount,
            selectedClassCount: selectedCount,
            feasibleCandidateCount,
            sourceCodes: Array.from(
              new Set([...preflightCodes, ...rejectionCodes]),
            ).sort(),
          },
        },
      ];
    });
    const requiredClassCount = requirements.reduce(
      (sum, requirement) => sum + requirement.requiredClassCount,
      0,
    );
    const missingClassCount = items.reduce(
      (sum, item) => sum + item.missingClassCount,
      0,
    );

    return SchedulingUnresolvedEvaluationSchema.parse({
      items,
      summary: {
        requiredClassCount,
        scheduledClassCount: requiredClassCount - missingClassCount,
        missingClassCount,
        unresolvedRequirementCount: items.length,
      },
    });
  }

  private resolveReason(
    mappedReasons: SchedulingUnresolvedReasonCode[],
    feasibleCandidateCount: number,
    requiredClassCount: number,
  ): SchedulingUnresolvedReasonCode {
    if (feasibleCandidateCount >= requiredClassCount) {
      return 'PLAN_COMBINATION_CONFLICT';
    }

    const prioritized = REASON_PRIORITY.find((reason) =>
      mappedReasons.includes(reason),
    );
    if (prioritized) return prioritized;

    return feasibleCandidateCount === 0
      ? 'NO_FEASIBLE_TIME_SLOT'
      : 'INSUFFICIENT_FEASIBLE_CANDIDATES';
  }

  private mapPreflightReason(
    code: string,
  ): SchedulingUnresolvedReasonCode | null {
    return (
      (
        {
          COURSE_WITHOUT_QUALIFIED_TEACHER: 'NO_QUALIFIED_TEACHER',
          COURSE_WITHOUT_AVAILABLE_TEACHER: 'NO_TEACHER_AVAILABILITY',
          NO_CLASSROOM_WITH_REQUIRED_CAPACITY:
            'INSUFFICIENT_CLASSROOM_CAPACITY',
        } as const
      )[
        code as
          | 'COURSE_WITHOUT_QUALIFIED_TEACHER'
          | 'COURSE_WITHOUT_AVAILABLE_TEACHER'
          | 'NO_CLASSROOM_WITH_REQUIRED_CAPACITY'
      ] ?? null
    );
  }

  private mapHardConstraintReason(
    code: SchedulingCandidateRejection['reasonCodes'][number],
  ): SchedulingUnresolvedReasonCode {
    return {
      INCOMPLETE_CLASS_REQUIREMENT: 'INVALID_REQUIREMENT',
      INVALID_TEACHER: 'NO_VALID_TEACHER',
      TEACHER_NOT_QUALIFIED: 'NO_QUALIFIED_TEACHER',
      OUTSIDE_TEACHER_AVAILABILITY: 'NO_TEACHER_AVAILABILITY',
      TEACHER_TIME_CONFLICT: 'TEACHER_TIME_CONFLICT',
      INVALID_DELIVERY_LOCATION: 'NO_COMPATIBLE_CLASSROOM',
      INSUFFICIENT_CLASSROOM_CAPACITY: 'INSUFFICIENT_CLASSROOM_CAPACITY',
      CLASSROOM_TIME_CONFLICT: 'CLASSROOM_TIME_CONFLICT',
    }[code] as SchedulingUnresolvedReasonCode;
  }
}
