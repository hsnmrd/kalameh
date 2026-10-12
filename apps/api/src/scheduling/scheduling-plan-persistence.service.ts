import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@workspace/database';
import {
  SchedulingAlternativePlanGenerationSchema,
  SchedulingPersistenceResultSchema,
  calculateTermScheduleFromDateRange,
  type SchedulingAlternativePlanGeneration,
  type SchedulingPersistenceResult,
  type SchedulingUnresolvedEvaluation,
  type WeekDay,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  planScoreBreakdown,
  planWarnings,
  proposalScoreBreakdown,
  resolveProposalDaysOfWeek,
  resolveWeights,
  toJson,
  validateGenerationScope,
  validateUnresolved,
  type PersistenceWeights,
} from './scheduling-plan-persistence.helpers';

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
    validateGenerationScope(generation);
    const weights = resolveWeights(input.weights);
    const unresolvedByPlanKey = validateUnresolved(
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
        term: { select: { startDate: true, endDate: true } },
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
          sessionsPerWeek: true,
          totalSessions: true,
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
        'missing or cross-tenant requirements in scheduling plan generation',
      );
    }
    if (qualifications.length !== qualificationIds.length) {
      throw new ConflictException(
        'missing or cross-tenant references in scheduling plan generation',
      );
    }
    if (classrooms.length !== classroomIds.length) {
      throw new ConflictException(
        'missing or cross-tenant classrooms in scheduling plan generation',
      );
    }

    const requirementById = new Map(
      requirements.map((requirement) => [requirement.id, requirement]),
    );
    const qualificationById = new Map(
      qualifications.map((qualification) => [qualification.id, qualification]),
    );

    for (const plan of generation.plans) {
      for (const requirement of plan.composition.requirements) {
        const persisted = requirementById.get(requirement.requirementId);
        if (!persisted || persisted.courseId !== requirement.courseId) {
          throw new ConflictException(
            'composition requirement mismatch with persisted course relation',
          );
        }
      }
      for (const assignment of plan.composition.assignments) {
        const candidate = assignment.candidate;
        const persistedReq = requirementById.get(candidate.requirementId);
        const persistedQual = qualificationById.get(candidate.qualificationId);
        if (
          !persistedReq ||
          !persistedQual ||
          persistedReq.courseId !== candidate.courseId ||
          persistedQual.courseId !== candidate.courseId ||
          persistedQual.teacherProfile?.userId !== candidate.teacherId
        ) {
          throw new ConflictException(
            'composition candidate references do not match persisted state',
          );
        }
      }
    }

    const termStartDate = run.term?.startDate ?? new Date(input.completedAt);
    const termEndDate =
      run.term?.endDate ??
      new Date(termStartDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const sessionDatesCache = new Map<string, string[]>();

    const planRows: Prisma.SchedulingPlanCreateManyInput[] = [];
    const proposalRows: Prisma.SchedulingProposalCreateManyInput[] = [];
    const unresolvedRows: Prisma.SchedulingUnresolvedRequirementCreateManyInput[] =
      [];
    const sessionRows: Prisma.SchedulingProposalSessionCreateManyInput[] = [];
    const planIds: string[] = [];
    let proposalCount = 0;
    let unresolvedRequirementCount = 0;

    for (const plan of generation.plans) {
      const planId = randomUUID();
      planIds.push(planId);
      const warnings = planWarnings(plan.composition.requirements);
      const unresolved = unresolvedByPlanKey.get(plan.planKey)!;

      planRows.push({
        id: planId,
        instituteId: input.instituteId,
        runId: input.runId,
        status: 'DRAFT',
        rank: plan.rank,
        isRecommended: plan.rank === 1,
        manualEditCount: 0,
        earnedWeightedPoints: plan.composition.summary.earnedWeightedPoints,
        applicableWeightedPoints:
          plan.composition.summary.applicableWeightedPoints,
        qualityIndex: plan.composition.summary.qualityIndex,
        coveragePercent: plan.composition.summary.coveragePercent,
        minimumCourseCoveragePercent:
          plan.composition.summary.minimumCourseCoveragePercent,
        scoreBreakdown: toJson(planScoreBreakdown(plan.composition, weights)),
        metricsSnapshot: toJson({
          planKey: plan.planKey,
          excludedAssignmentKeys: plan.excludedAssignmentKeys,
          ...plan.composition.summary,
        }),
        weightsSnapshot: toJson(snapshotSource.weightsSnapshot),
        timeGroupsSnapshot: toJson(snapshotSource.timeGroupsSnapshot),
        dataCompletenessSnapshot: toJson(
          snapshotSource.dataCompletenessSnapshot,
        ),
        warnings: toJson(warnings),
        formulaVersion: snapshotSource.formulaVersion,
        generatedAt: input.completedAt,
        lastScoredAt: input.completedAt,
      });

      for (const assignment of plan.composition.assignments) {
        const candidate = assignment.candidate;
        const requirement = requirementById.get(candidate.requirementId)!;
        const scoreBreakdown = proposalScoreBreakdown(
          assignment.projectedCoveragePercent,
          assignment.projectedTimeDiversityScore,
          assignment.projectedWeightedPoints,
          weights,
        );
        const proposalId = randomUUID();
        const daysOfWeek = resolveProposalDaysOfWeek(
          candidate.dayOfWeek,
          candidate.timeGroup,
          requirement.sessionsPerWeek,
          snapshotSource.timeGroupsSnapshot,
        );

        proposalRows.push({
          id: proposalId,
          planId,
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
          daysOfWeek,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          timeGroup: candidate.timeGroup,
          score: scoreBreakdown.qualityIndex,
          scoreBreakdown: toJson(scoreBreakdown),
          selectionReasons: toJson(assignment.selectionReasons),
          scoredAt: input.completedAt,
          warnings: toJson([]),
          isLocked: false,
          isManuallyEdited: false,
          editCount: 0,
        });

        const daysKey = (daysOfWeek as WeekDay[]).slice().sort().join(',');
        let sessionDates = sessionDatesCache.get(daysKey);
        if (!sessionDates) {
          const schedule = calculateTermScheduleFromDateRange({
            startDate: termStartDate,
            endDate: termEndDate,
            daysOfWeek: daysOfWeek as WeekDay[],
            skipHolidays: true,
            observeOfficialHolidays: true,
          });
          sessionDates = schedule.sessionDates;
          sessionDatesCache.set(daysKey, sessionDates);
        }

        for (const dateStr of sessionDates) {
          sessionRows.push({
            instituteId: input.instituteId,
            planId,
            proposalId,
            sessionDate: new Date(dateStr),
            startTime: candidate.startTime,
            endTime: candidate.endTime,
          });
        }
      }

      for (const item of unresolved.items) {
        unresolvedRows.push({
          instituteId: input.instituteId,
          planId,
          classRequirementId: item.classRequirementId,
          reasonCode: item.reasonCode,
          missingClassCount: item.missingClassCount,
          details: toJson(item.details),
        });
      }

      proposalCount += plan.composition.assignments.length;
      unresolvedRequirementCount += unresolved.items.length;
    }

    const result = await this.prisma.$transaction(
      async (transaction) => {
        await transaction.schedulingPlan.deleteMany({
          where: { runId: input.runId, instituteId: input.instituteId },
        });

        if (transaction.schedulingPlan.createMany) {
          await transaction.schedulingPlan.createMany({
            data: planRows,
          });
        } else {
          for (const planRow of planRows) {
            await transaction.schedulingPlan.create({ data: planRow });
          }
        }

        if (proposalRows.length > 0) {
          await transaction.schedulingProposal.createMany({
            data: proposalRows,
          });
        }

        if (unresolvedRows.length > 0) {
          await transaction.schedulingUnresolvedRequirement.createMany({
            data: unresolvedRows,
          });
        }

        if (sessionRows.length > 0) {
          await transaction.schedulingProposalSession?.createMany?.({
            data: sessionRows,
            skipDuplicates: true,
          });
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
      },
      {
        maxWait: 10_000,
        timeout: 60_000,
      },
    );

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
}
