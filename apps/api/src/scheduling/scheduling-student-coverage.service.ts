import { Injectable } from '@nestjs/common';
import {
  SchedulingCoverageEvaluationSchema,
  type SchedulingCandidateCoverage,
  type SchedulingCoverageEvaluation,
  type SchedulingFeasibleCandidate,
  type StudentScheduleStatus,
} from '@workspace/types';

type CoverageTimeConstraint = {
  kind: 'UNAVAILABLE' | 'PREFERRED';
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  effectiveFrom?: Date | string | null;
  effectiveUntil?: Date | string | null;
};

type CoverageStudent = {
  id: string;
  currentAllowedCourseId: string | null;
  studentProfile: {
    scheduleStatus: StudentScheduleStatus;
    timeConstraints: CoverageTimeConstraint[];
  } | null;
};

export type EvaluateStudentCoverageInput = {
  candidates: SchedulingFeasibleCandidate[];
  courseIds: string[];
  students: CoverageStudent[];
  termStartDate: Date | string;
  termEndDate: Date | string;
};

@Injectable()
export class SchedulingStudentCoverageService {
  evaluate(input: EvaluateStudentCoverageInput): SchedulingCoverageEvaluation {
    const termStart = this.dateOnlyTimestamp(input.termStartDate);
    const termEnd = this.dateOnlyTimestamp(input.termEndDate);
    if (termStart === null || termEnd === null || termStart > termEnd) {
      throw new RangeError('term date range is invalid');
    }

    const courseIds = Array.from(new Set(input.courseIds)).sort();
    const courseIdSet = new Set(courseIds);
    const studentById = new Map<string, CoverageStudent>();
    for (const student of [...input.students].sort((left, right) =>
      left.id.localeCompare(right.id),
    )) {
      if (
        student.currentAllowedCourseId &&
        courseIdSet.has(student.currentAllowedCourseId) &&
        !studentById.has(student.id)
      ) {
        studentById.set(student.id, student);
      }
    }
    const students = Array.from(studentById.values());
    const candidates = Array.from(
      new Map(
        [...input.candidates]
          .filter((candidate) => courseIdSet.has(candidate.courseId))
          .sort((left, right) =>
            left.assignmentKey.localeCompare(right.assignmentKey),
          )
          .map((candidate) => [candidate.assignmentKey, candidate]),
      ).values(),
    );
    const candidateCoverage: SchedulingCandidateCoverage[] = candidates.map(
      (candidate) => {
        const courseStudents = students.filter(
          (student) => student.currentAllowedCourseId === candidate.courseId,
        );
        const knownStudents = courseStudents.filter(
          (student) => student.studentProfile?.scheduleStatus === 'COMPLETE',
        );
        const coveredStudentIds: string[] = [];
        const uncoveredStudentIds: string[] = [];

        for (const student of knownStudents) {
          const unavailable =
            student.studentProfile?.timeConstraints.some(
              (constraint) =>
                constraint.kind === 'UNAVAILABLE' &&
                constraint.dayOfWeek === candidate.dayOfWeek &&
                this.appliesDuringTerm(constraint, termStart, termEnd) &&
                this.hasTimeOverlap(candidate, constraint),
            ) ?? false;
          (unavailable ? uncoveredStudentIds : coveredStudentIds).push(
            student.id,
          );
        }

        const knownStudentCount = knownStudents.length;
        return {
          candidate,
          status: knownStudentCount === 0 ? 'NOT_APPLICABLE' : 'APPLICABLE',
          knownStudentCount,
          unknownStudentCount: courseStudents.length - knownStudentCount,
          coveredStudentIds,
          uncoveredStudentIds,
          coveragePercent:
            knownStudentCount === 0
              ? null
              : this.percent(coveredStudentIds.length, knownStudentCount),
        };
      },
    );

    const courses = courseIds.map((courseId) => {
      const courseStudents = students.filter(
        (student) => student.currentAllowedCourseId === courseId,
      );
      const knownStudentCount = courseStudents.filter(
        (student) => student.studentProfile?.scheduleStatus === 'COMPLETE',
      ).length;
      const matchingCandidates = candidateCoverage.filter(
        (coverage) => coverage.candidate.courseId === courseId,
      );
      const bestCoveredStudentCount = Math.max(
        0,
        ...matchingCandidates.map(
          (coverage) => coverage.coveredStudentIds.length,
        ),
      );

      return {
        courseId,
        status: knownStudentCount === 0 ? 'NOT_APPLICABLE' : 'APPLICABLE',
        knownStudentCount,
        unknownStudentCount: courseStudents.length - knownStudentCount,
        bestCoveredStudentCount,
        bestCoveragePercent:
          knownStudentCount === 0
            ? null
            : this.percent(bestCoveredStudentCount, knownStudentCount),
        candidateCount: matchingCandidates.length,
      } as const;
    });
    const knownStudentCount = students.filter(
      (student) => student.studentProfile?.scheduleStatus === 'COMPLETE',
    ).length;

    return SchedulingCoverageEvaluationSchema.parse({
      candidates: candidateCoverage,
      courses,
      summary: {
        candidateCount: candidateCoverage.length,
        courseCount: courses.length,
        studentCount: students.length,
        knownStudentCount,
        unknownStudentCount: students.length - knownStudentCount,
      },
    });
  }

  private appliesDuringTerm(
    constraint: CoverageTimeConstraint,
    termStart: number,
    termEnd: number,
  ): boolean {
    const effectiveFrom = constraint.effectiveFrom
      ? this.dateOnlyTimestamp(constraint.effectiveFrom)
      : null;
    const effectiveUntil = constraint.effectiveUntil
      ? this.dateOnlyTimestamp(constraint.effectiveUntil)
      : null;

    if (constraint.effectiveFrom && effectiveFrom === null) return true;
    if (constraint.effectiveUntil && effectiveUntil === null) return true;

    return !(
      (effectiveUntil !== null && effectiveUntil < termStart) ||
      (effectiveFrom !== null && effectiveFrom > termEnd)
    );
  }

  private hasTimeOverlap(
    candidate: Pick<SchedulingFeasibleCandidate, 'startTime' | 'endTime'>,
    constraint: CoverageTimeConstraint,
  ): boolean {
    if (
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(constraint.startTime) ||
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(constraint.endTime) ||
      constraint.startTime >= constraint.endTime
    ) {
      return true;
    }

    return (
      candidate.startTime < constraint.endTime &&
      constraint.startTime < candidate.endTime
    );
  }

  private dateOnlyTimestamp(value: Date | string): number | null {
    if (value instanceof Date && Number.isNaN(value.getTime())) return null;
    const datePart =
      value instanceof Date
        ? value.toISOString().slice(0, 10)
        : value.slice(0, 10);
    const timestamp = Date.parse(`${datePart}T00:00:00.000Z`);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  private percent(numerator: number, denominator: number): number {
    return Math.round((numerator / denominator) * 10000) / 100;
  }
}
