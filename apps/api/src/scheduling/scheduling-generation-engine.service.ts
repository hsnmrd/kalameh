import { ConflictException, Injectable } from '@nestjs/common';
import {
  SchedulingEngineInputSnapshotSchema,
  SchedulingEngineSettingsSnapshotSchema,
  SchedulingPreflightReportSchema,
  type SchedulingPersistenceResult,
  type SchedulingUnresolvedEvaluation,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingAlternativePlanService } from './scheduling-alternative-plan.service';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import { SchedulingPlanPersistenceService } from './scheduling-plan-persistence.service';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';
import { SchedulingUnresolvedRequirementService } from './scheduling-unresolved-requirement.service';

@Injectable()
export class SchedulingGenerationEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidateSlotService: SchedulingCandidateSlotService,
    private readonly hardConstraintService: SchedulingHardConstraintService,
    private readonly studentCoverageService: SchedulingStudentCoverageService,
    private readonly alternativePlanService: SchedulingAlternativePlanService,
    private readonly unresolvedRequirementService: SchedulingUnresolvedRequirementService,
    private readonly persistenceService: SchedulingPlanPersistenceService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async process(
    instituteId: string,
    runId: string,
    startedAt = new Date(),
  ): Promise<SchedulingPersistenceResult> {
    if (Number.isNaN(startedAt.getTime())) {
      throw new RangeError('generation start time must be valid');
    }
    const run = await this.prisma.schedulingRun.findFirst({
      where: { id: runId, instituteId },
      select: {
        id: true,
        requestedByUserId: true,
        status: true,
        inputSnapshot: true,
        settingsSnapshot: true,
        preflightReport: true,
      },
    });
    if (!run) {
      throw new ConflictException('queued scheduling run was not found');
    }
    const claimed = await this.prisma.schedulingRun.updateMany({
      where: { id: runId, instituteId, status: 'QUEUED' },
      data: {
        status: 'GENERATING',
        startedAt,
        completedAt: null,
        failureCode: null,
        failureMessage: null,
      },
    });
    if (claimed.count !== 1) {
      throw new ConflictException('scheduling run is not queued');
    }

    try {
      const snapshot = SchedulingEngineInputSnapshotSchema.parse(
        run.inputSnapshot,
      );
      const settings = SchedulingEngineSettingsSnapshotSchema.parse(
        run.settingsSnapshot,
      );
      const preflightReport = SchedulingPreflightReportSchema.parse(
        run.preflightReport,
      );
      if (!preflightReport.passed) {
        throw new ConflictException(
          'a preflight-failed run cannot enter generation',
        );
      }

      const candidates = this.candidateSlotService.generate({
        requirements: snapshot.requirements,
        qualifications: snapshot.teachers,
        timeGroups: settings.timeGroups,
        stepMinutes: settings.generation.candidateStepMinutes,
      });
      const hardConstraints = this.hardConstraintService.evaluate({
        candidates,
        requirements: snapshot.requirements,
        qualifications: snapshot.teachers,
        classrooms: snapshot.classrooms,
        existingClasses: snapshot.existingClasses,
      });
      const coverage = this.studentCoverageService.evaluate({
        candidates: hardConstraints.accepted,
        courseIds: Array.from(
          new Set(
            snapshot.requirements.map((requirement) => requirement.courseId),
          ),
        ).sort(),
        students: snapshot.students,
        termStartDate: snapshot.term.startDate,
        termEndDate: snapshot.term.endDate,
      });
      const generation = this.alternativePlanService.generate({
        requirements: snapshot.requirements,
        feasibleCandidates: hardConstraints.accepted,
        coverageEvaluation: coverage,
        alternativePlanCount: snapshot.request.alternativePlanCount,
        weights: {
          studentCoverage: settings.weights.studentCoverage,
          timeDiversity: settings.weights.timeDiversity,
        },
      });
      const unresolvedByPlanKey: Record<
        string,
        SchedulingUnresolvedEvaluation
      > = Object.fromEntries(
        generation.plans.map((plan) => [
          plan.planKey,
          this.unresolvedRequirementService.evaluate({
            requirements: snapshot.requirements,
            selectedAssignments: plan.composition.assignments.map(
              ({ candidate }) => ({
                assignmentKey: candidate.assignmentKey,
                requirementId: candidate.requirementId,
              }),
            ),
            feasibleAssignments: hardConstraints.accepted,
            rejectedCandidates: hardConstraints.rejected,
            preflightIssues: preflightReport.issues,
          }),
        ]),
      );

      return await this.persistenceService.persist({
        instituteId,
        runId,
        generation,
        unresolvedByPlanKey,
        completedAt: startedAt,
        weights: {
          studentCoverage: settings.weights.studentCoverage,
          timeDiversity: settings.weights.timeDiversity,
        },
      });
    } catch (error) {
      const failureMessage =
        error instanceof Error ? error.message.slice(0, 500) : 'Unknown error';
      await this.prisma.schedulingRun.updateMany({
        where: { id: runId, instituteId, status: 'GENERATING' },
        data: {
          status: 'FAILED',
          failureCode: 'GENERATION_ENGINE_FAILED',
          failureMessage,
          completedAt: startedAt,
        },
      });
      await this.auditLogsService.log({
        instituteId,
        userId: run.requestedByUserId,
        module: 'SCHEDULING',
        entityId: runId,
        action: 'GENERATION_FAILED',
        metadata: { failureCode: 'GENERATION_ENGINE_FAILED' },
      });
      throw error;
    }
  }
}
