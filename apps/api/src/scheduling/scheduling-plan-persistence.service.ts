import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@workspace/database';
import {
  DEFAULT_SCHEDULING_SETTINGS,
  SchedulingAlternativePlanGenerationSchema,
  SchedulingPersistenceResultSchema,
  SchedulingUnresolvedEvaluationSchema,
  type SchedulingAlternativePlanGeneration,
  type SchedulingPersistenceResult,
  type SchedulingScoreCriterion,
  type SchedulingUnresolvedEvaluation,
  type SchedulingWarning,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';

type PersistenceWeights = {
  studentCoverage: number;
  timeDiversity: number;
};

export type PersistSchedulingPlansInput = {
  instituteId: string;
  runId: string;
  generation: SchedulingAlternativePlanGeneration;
  unresolvedByPlanKey: Record<string, SchedulingUnresolvedEvaluation>;
  completedAt: Date;
  weights?: Partial<PersistenceWeights>;
};

@Injectable()
export class SchedulingPlanPersistenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async persist(
    input: PersistSchedulingPlansInput,
  ): Promise<SchedulingPersistenceResult> {
    if (Number.isNaN(input.completedAt.getTime())) {
      throw new RangeError('completion time must be valid');
    }
    const generation = SchedulingAlternativePlanGenerationSchema.parse(
      input.generation,
    );
    if (generation.plans.length === 0) {
      throw new RangeError('at least one generated plan is required');
    }
    this.validateGenerationScope(generation);
    const weights = this.resolveWeights(input.weights);
    const unresolvedByPlanKey = this.validateUnresolved(
      generation,
      input.unresolvedByPlanKey,
    );
    const run = await this.prisma.schedulingRun.findFirst({
      where: { id: input.runId, instituteId: input.instituteId },
      select: {
        id: true,
        requestedByUserId: true,
        status: true,
        startedAt: true,
        plans: {
          orderBy: { rank: 'asc' as const },
          select: {
            id: true,
            status: true,
            manualEditCount: true,
            weightsSnapshot: true,
            timeGroupsSnapshot: true,
            dataCompletenessSnapshot: true,
            formulaVersion: true,
            proposals: {
              select: {
                isLocked: true,
                isManuallyEdited: true,
                publishedClassId: true,
              },
            },
          },
        },
      },
    });
    if (
      !run ||
      !['QUEUED', 'GENERATING'].includes(run.status) ||
      run.plans.length === 0 ||
      run.plans.some(
        (plan) =>
          plan.status !== 'DRAFT' ||
          plan.manualEditCount > 0 ||
          plan.proposals.some(
            (proposal) =>
              proposal.isLocked ||
              proposal.isManuallyEdited ||
              proposal.publishedClassId !== null,
          ),
      )
    ) {
      throw new ConflictException(
        'scheduling run is not safe for generated plan replacement',
      );
    }
    const snapshotSource = run.plans[0];
    const requirementIds = Array.from(
      new Set(
        generation.plans.flatMap(({ composition }) => [
          ...composition.requirements.map(({ requirementId }) => requirementId),
          ...composition.assignments.map(
            ({ candidate }) => candidate.requirementId,
          ),
        ]),
      ),
    ).sort();
    const assignments = generation.plans.flatMap(
      ({ composition }) => composition.assignments,
    );
    const qualificationIds = Array.from(
      new Set(assignments.map(({ candidate }) => candidate.qualificationId)),
    ).sort();
    const classroomIds = Array.from(
      new Set(
        assignments.flatMap(({ candidate }) =>
          candidate.classroomId === null ? [] : [candidate.classroomId],
        ),
      ),
    ).sort();
    const [requirements, qualifications, classrooms] = await Promise.all([
      this.prisma.classRequirement.findMany({
        where: {
          id: { in: requirementIds },
          instituteId: input.instituteId,
        },
        select: {
          id: true,
          courseId: true,
          branchId: true,
          course: { select: { title: true } },
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.teacherCourseQualification.findMany({
        where: {
          id: { in: qualificationIds },
          instituteId: input.instituteId,
        },
        select: {
          id: true,
          courseId: true,
          teacherProfile: { select: { userId: true } },
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.classroom.findMany({
        where: {
          id: { in: classroomIds },
          instituteId: input.instituteId,
        },
        select: { id: true },
        orderBy: { id: 'asc' },
      }),
    ]);
    if (requirements.length !== requirementIds.length) {
      throw new ConflictException(
        'generated plans reference missing or cross-tenant requirements',
      );
    }
    const requirementById = new Map(
      requirements.map((requirement) => [requirement.id, requirement]),
    );
    const qualificationById = new Map(
      qualifications.map((qualification) => [qualification.id, qualification]),
    );
    const classroomIdSet = new Set(classrooms.map(({ id }) => id));
    if (
      qualifications.length !== qualificationIds.length ||
      classrooms.length !== classroomIds.length ||
      assignments.some(({ candidate }) => {
        const requirement = requirementById.get(candidate.requirementId);
        const qualification = qualificationById.get(candidate.qualificationId);
        return (
          !requirement ||
          requirement.courseId !== candidate.courseId ||
          requirement.branchId !== candidate.branchId ||
          !qualification ||
          qualification.courseId !== candidate.courseId ||
          qualification.teacherProfile.userId !== candidate.teacherId ||
          (candidate.classroomId !== null &&
            !classroomIdSet.has(candidate.classroomId))
        );
      })
    ) {
      throw new ConflictException(
        'generated proposals contain missing or cross-tenant references',
      );
    }

    const result = await this.prisma.$transaction(async (transaction) => {
      await transaction.schedulingPlan.deleteMany({
        where: { runId: input.runId, instituteId: input.instituteId },
      });
      const planIds: string[] = [];
      let proposalCount = 0;
      let unresolvedRequirementCount = 0;

      for (const plan of generation.plans) {
        const unresolved = unresolvedByPlanKey.get(plan.planKey)!;
        const warnings = this.planWarnings(plan.composition.requirements);
        const created = await transaction.schedulingPlan.create({
          data: {
            instituteId: input.instituteId,
            runId: input.runId,
            status: 'DRAFT',
            rank: plan.rank,
            isRecommended: plan.isRecommended,
            earnedWeightedPoints: plan.composition.summary.earnedWeightedPoints,
            applicableWeightedPoints:
              plan.composition.summary.applicableWeightedPoints,
            qualityIndex: plan.composition.summary.qualityIndex,
            coveragePercent: plan.composition.summary.coveragePercent,
            minimumCourseCoveragePercent:
              plan.composition.summary.minimumCourseCoveragePercent,
            scoreBreakdown: this.toJson(
              this.planScoreBreakdown(plan.composition, weights),
            ),
            metricsSnapshot: this.toJson({
              planKey: plan.planKey,
              excludedAssignmentKeys: plan.excludedAssignmentKeys,
              ...plan.composition.summary,
            }),
            weightsSnapshot: this.toJson(snapshotSource.weightsSnapshot),
            timeGroupsSnapshot: this.toJson(snapshotSource.timeGroupsSnapshot),
            dataCompletenessSnapshot: this.toJson(
              snapshotSource.dataCompletenessSnapshot,
            ),
            warnings: this.toJson(warnings),
            formulaVersion: snapshotSource.formulaVersion,
            generatedAt: input.completedAt,
            lastScoredAt: input.completedAt,
            proposals: {
              create: plan.composition.assignments.map((assignment) => {
                const candidate = assignment.candidate;
                const requirement = requirementById.get(
                  candidate.requirementId,
                )!;
                const scoreBreakdown = this.proposalScoreBreakdown(
                  assignment.projectedCoveragePercent,
                  assignment.projectedTimeDiversityScore,
                  assignment.projectedWeightedPoints,
                  weights,
                );
                return {
                  instituteId: input.instituteId,
                  classRequirementId: requirement.id,
                  courseId: requirement.courseId,
                  branchId: requirement.branchId,
                  teacherId: candidate.teacherId,
                  classroomId: candidate.classroomId,
                  teacherQualificationId: candidate.qualificationId,
                  qualificationCheckedAt: input.completedAt,
                  title: requirement.course.title,
                  capacity: candidate.capacity,
                  deliveryMode: candidate.deliveryMode,
                  daysOfWeek: [candidate.dayOfWeek],
                  startTime: candidate.startTime,
                  endTime: candidate.endTime,
                  timeGroup: candidate.timeGroup,
                  score: scoreBreakdown.qualityIndex,
                  scoreBreakdown: this.toJson(scoreBreakdown),
                  selectionReasons: this.toJson(assignment.selectionReasons),
                  scoredAt: input.completedAt,
                  warnings: this.toJson([]),
                  isLocked: false,
                  isManuallyEdited: false,
                  editCount: 0,
                };
              }),
            },
            unresolvedRequirements: {
              create: unresolved.items.map((item) => ({
                instituteId: input.instituteId,
                classRequirementId: item.classRequirementId,
                reasonCode: item.reasonCode,
                missingClassCount: item.missingClassCount,
                details: this.toJson(item.details),
              })),
            },
          },
          select: { id: true },
        });
        planIds.push(created.id);
        proposalCount += plan.composition.assignments.length;
        unresolvedRequirementCount += unresolved.items.length;
      }

      const updatedRun = await transaction.schedulingRun.updateMany({
        where: {
          id: input.runId,
          instituteId: input.instituteId,
          status: { in: ['QUEUED', 'GENERATING'] },
        },
        data: {
          status: 'COMPLETED',
          failureCode: null,
          failureMessage: null,
          startedAt: run.startedAt ?? input.completedAt,
          completedAt: input.completedAt,
        },
      });
      if (updatedRun.count !== 1) {
        throw new ConflictException(
          'scheduling run changed while results were being persisted',
        );
      }

      return SchedulingPersistenceResultSchema.parse({
        runId: input.runId,
        status: 'COMPLETED',
        planIds,
        proposalCount,
        unresolvedRequirementCount,
        completedAt: input.completedAt,
      });
    });

    await this.auditLogsService.log({
      instituteId: input.instituteId,
      userId: run.requestedByUserId,
      module: 'SCHEDULING',
      entityId: input.runId,
      action: 'GENERATION_COMPLETED',
      metadata: {
        planCount: result.planIds.length,
        proposalCount: result.proposalCount,
        unresolvedRequirementCount: result.unresolvedRequirementCount,
      },
    });
    return result;
  }

  private validateUnresolved(
    generation: SchedulingAlternativePlanGeneration,
    unresolvedInput: Record<string, SchedulingUnresolvedEvaluation>,
  ): Map<string, SchedulingUnresolvedEvaluation> {
    const expectedPlanKeys = generation.plans
      .map(({ planKey }) => planKey)
      .sort();
    const receivedPlanKeys = Object.keys(unresolvedInput).sort();
    if (expectedPlanKeys.join('|') !== receivedPlanKeys.join('|')) {
      throw new RangeError(
        'unresolved evaluations must match generated plan keys',
      );
    }
    return new Map(
      generation.plans.map((plan) => {
        const unresolved = SchedulingUnresolvedEvaluationSchema.parse(
          unresolvedInput[plan.planKey],
        );
        const summary = plan.composition.summary;
        if (
          unresolved.summary.requiredClassCount !==
            summary.requiredClassCount ||
          unresolved.summary.scheduledClassCount !==
            summary.scheduledClassCount ||
          unresolved.summary.missingClassCount !== summary.missingClassCount
        ) {
          throw new RangeError(
            'unresolved evaluation totals must match plan composition',
          );
        }
        return [plan.planKey, unresolved];
      }),
    );
  }

  private validateGenerationScope(
    generation: SchedulingAlternativePlanGeneration,
  ): void {
    const scopeSignatures = generation.plans.map(({ composition }) =>
      composition.requirements
        .map(
          ({ requirementId, courseId, requiredClassCount }) =>
            `${requirementId}:${courseId}:${requiredClassCount}`,
        )
        .sort()
        .join('|'),
    );
    if (
      scopeSignatures[0] === '' ||
      scopeSignatures.some((signature) => signature !== scopeSignatures[0])
    ) {
      throw new RangeError(
        'generated plans must share one non-empty requirement scope',
      );
    }
  }

  private planScoreBreakdown(
    composition: SchedulingAlternativePlanGeneration['plans'][number]['composition'],
    weights: PersistenceWeights,
  ): {
    criteria: SchedulingScoreCriterion[];
    earnedWeightedPoints: number;
    applicableWeightedPoints: number;
    qualityIndex: number | null;
  } {
    return {
      criteria: [
        this.coverageCriterion(composition.summary.coveragePercent, weights),
        this.timeCriterion(composition.summary.timeDiversityScore, weights),
      ],
      earnedWeightedPoints: composition.summary.earnedWeightedPoints,
      applicableWeightedPoints: composition.summary.applicableWeightedPoints,
      qualityIndex: composition.summary.qualityIndex,
    };
  }

  private proposalScoreBreakdown(
    coveragePercent: number | null,
    timeDiversityScore: number,
    earnedWeightedPoints: number,
    weights: PersistenceWeights,
  ): {
    criteria: SchedulingScoreCriterion[];
    earnedWeightedPoints: number;
    applicableWeightedPoints: number;
    qualityIndex: number | null;
  } {
    const applicableWeightedPoints =
      (coveragePercent === null ? 0 : weights.studentCoverage) +
      weights.timeDiversity;
    return {
      criteria: [
        this.coverageCriterion(coveragePercent, weights),
        this.timeCriterion(timeDiversityScore, weights),
      ],
      earnedWeightedPoints,
      applicableWeightedPoints,
      qualityIndex:
        applicableWeightedPoints === 0
          ? null
          : this.round(
              (earnedWeightedPoints / applicableWeightedPoints) * 100,
              2,
            ),
    };
  }

  private coverageCriterion(
    coveragePercent: number | null,
    weights: PersistenceWeights,
  ): SchedulingScoreCriterion {
    if (coveragePercent === null) {
      return {
        code: 'SC_STUDENT_COVERAGE',
        status: 'NOT_APPLICABLE',
        rawValue: null,
        normalizedScore: null,
        weight: weights.studentCoverage,
        weightedPoints: null,
        details: {},
      };
    }
    const normalizedScore = coveragePercent / 100;
    return {
      code: 'SC_STUDENT_COVERAGE',
      status: 'APPLICABLE',
      rawValue: normalizedScore,
      normalizedScore,
      weight: weights.studentCoverage,
      weightedPoints: this.round(normalizedScore * weights.studentCoverage, 2),
      details: { coveragePercent },
    };
  }

  private timeCriterion(
    normalizedScore: number,
    weights: PersistenceWeights,
  ): SchedulingScoreCriterion {
    return {
      code: 'SC_TIME_PATTERN_DIVERSITY',
      status: 'APPLICABLE',
      rawValue: normalizedScore,
      normalizedScore,
      weight: weights.timeDiversity,
      weightedPoints: this.round(normalizedScore * weights.timeDiversity, 2),
      details: {},
    };
  }

  private planWarnings(
    requirements: SchedulingAlternativePlanGeneration['plans'][number]['composition']['requirements'],
  ): SchedulingWarning[] {
    const warnings = requirements.flatMap(
      ({ timeDistribution }) => timeDistribution.warnings,
    );
    return Array.from(
      new Map(
        warnings.map((warning) => [JSON.stringify(warning), warning]),
      ).values(),
    );
  }

  private resolveWeights(
    overrides: Partial<PersistenceWeights> | undefined,
  ): PersistenceWeights {
    const weights = {
      studentCoverage:
        overrides?.studentCoverage ??
        DEFAULT_SCHEDULING_SETTINGS.weights.studentCoverage,
      timeDiversity:
        overrides?.timeDiversity ??
        DEFAULT_SCHEDULING_SETTINGS.weights.timeDiversity,
    };
    if (
      Object.values(weights).some(
        (weight) => !Number.isInteger(weight) || weight < 0 || weight > 100,
      ) ||
      weights.studentCoverage + weights.timeDiversity > 100
    ) {
      throw new RangeError('persistence weights must match composition limits');
    }
    return weights;
  }

  private round(value: number, digits: number): number {
    const factor = 10 ** digits;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
