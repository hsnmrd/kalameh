import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@workspace/database';
import {
  DEFAULT_SCHEDULING_SETTINGS,
  ROLES,
  SchedulingRunSchema,
  type GenerateSchedulingPlanInput,
  type JwtPayload,
  type SchedulingRunDto,
  type SupportedLocale,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingPreflightService } from './scheduling-preflight.service';
import { SchedulingGenerationDispatcherService } from './scheduling-generation-dispatcher.service';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
    private readonly preflightService: SchedulingPreflightService,
    private readonly generationDispatcher: SchedulingGenerationDispatcherService,
  ) {}

  async generate(
    currentUser: JwtPayload,
    input: GenerateSchedulingPlanInput,
    locale: SupportedLocale = 'fa',
  ): Promise<SchedulingRunDto> {
    const instituteId = this.resolveInstituteId(
      currentUser,
      input.instituteId,
      locale,
    );
    const branchId = input.branchId ?? null;

    const [term, branch, requirements] = await Promise.all([
      this.prisma.term.findFirst({
        where: { id: input.termId, instituteId },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      }),
      branchId
        ? this.prisma.branch.findFirst({
            where: { id: branchId, instituteId },
            select: { id: true, name: true, isActive: true },
          })
        : Promise.resolve(null),
      this.prisma.classRequirement.findMany({
        where: {
          id: { in: input.requirementIds },
          instituteId,
          termId: input.termId,
          isActive: true,
        },
        select: {
          id: true,
          termId: true,
          courseId: true,
          branchId: true,
          requiredClassCount: true,
          capacity: true,
          sessionDurationMinutes: true,
          sessionsPerWeek: true,
          totalSessions: true,
          deliveryMode: true,
          updatedAt: true,
          course: { select: { title: true } },
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    if (
      !term ||
      !term.isActive ||
      (branchId !== null && (!branch || !branch.isActive))
    ) {
      throw new BadRequestException(
        this.i18n.t('scheduling.invalidScope', locale),
      );
    }

    if (
      requirements.length !== input.requirementIds.length ||
      requirements.some(
        (requirement) =>
          branchId !== null &&
          requirement.branchId !== null &&
          requirement.branchId !== branchId,
      )
    ) {
      throw new BadRequestException(
        this.i18n.t('scheduling.invalidRequirements', locale),
      );
    }

    const source = await this.validateRegeneration(
      instituteId,
      input,
      branchId,
      locale,
    );
    const courseIds = Array.from(
      new Set(requirements.map((requirement) => requirement.courseId)),
    );
    const [teachers, students, existingClasses, classrooms, activeTeachers] =
      await Promise.all([
        this.prisma.teacherCourseQualification.findMany({
          where: {
            instituteId,
            courseId: { in: courseIds },
            teacherProfile: {
              user: {
                isActive: true,
                role: 'TEACHER',
                ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
              },
            },
          },
          select: {
            id: true,
            courseId: true,
            updatedAt: true,
            teacherProfile: {
              select: {
                userId: true,
                user: {
                  select: { branchId: true, isActive: true, role: true },
                },
                availabilities: {
                  select: {
                    id: true,
                    dayOfWeek: true,
                    startTime: true,
                    endTime: true,
                    updatedAt: true,
                  },
                  orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
                },
              },
            },
          },
          orderBy: { id: 'asc' },
        }),
        this.prisma.user.findMany({
          where: {
            instituteId,
            isActive: true,
            currentAllowedCourseId: { in: courseIds },
            ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
          },
          select: {
            id: true,
            branchId: true,
            currentAllowedCourseId: true,
            studentProfile: {
              select: {
                scheduleStatus: true,
                updatedAt: true,
                timeConstraints: {
                  select: {
                    id: true,
                    kind: true,
                    source: true,
                    dayOfWeek: true,
                    startTime: true,
                    endTime: true,
                    effectiveFrom: true,
                    effectiveUntil: true,
                    updatedAt: true,
                  },
                  orderBy: { id: 'asc' },
                },
              },
            },
          },
          orderBy: { id: 'asc' },
        }),
        this.prisma.class.findMany({
          where: {
            instituteId,
            termId: input.termId,
            ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
          },
          select: {
            id: true,
            courseId: true,
            branchId: true,
            classroomId: true,
            teacherId: true,
            daysOfWeek: true,
            sessionDates: true,
            startTime: true,
            endTime: true,
            updatedAt: true,
          },
          orderBy: { id: 'asc' },
        }),
        this.prisma.classroom.findMany({
          where: {
            instituteId,
            isActive: true,
            ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
          },
          select: {
            id: true,
            branchId: true,
            name: true,
            capacity: true,
            isActive: true,
            updatedAt: true,
          },
          orderBy: { id: 'asc' },
        }),
        this.prisma.user.findMany({
          where: {
            instituteId,
            isActive: true,
            role: 'TEACHER',
            ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
          },
          select: {
            id: true,
            teacherProfile: {
              select: {
                teachableCourses: { select: { id: true } },
              },
            },
          },
          orderBy: { id: 'asc' },
        }),
      ]);

    const capturedAt = new Date();
    const preflightReport = this.preflightService.evaluate({
      checkedAt: capturedAt,
      requirements,
      teachers,
      students,
      classrooms,
      activeTeachers,
    });
    const inputSnapshot = this.toJson({
      schemaVersion: '1',
      capturedAt,
      request: {
        termId: input.termId,
        branchId,
        requirementIds: requirements.map((requirement) => requirement.id),
        alternativePlanCount: input.alternativePlanCount,
        sourceRunId: input.sourceRunId ?? null,
        lockedProposalIds: source.lockedProposalIds,
      },
      term,
      branch,
      requirements,
      teachers,
      activeTeachers,
      students,
      existingClasses,
      classrooms,
    });
    const settingsSnapshot = this.toJson({
      schemaVersion: '1',
      capturedAt,
      source: 'MVP_DEFAULTS',
      instituteOverrideApplied: false,
      ...DEFAULT_SCHEDULING_SETTINGS,
    });
    const completeStudentSchedules = students.filter(
      (student) => student.studentProfile?.scheduleStatus === 'COMPLETE',
    ).length;
    const dataCompletenessSnapshot = this.toJson({
      studentCount: students.length,
      completeStudentScheduleCount: completeStudentSchedules,
      incompleteStudentScheduleCount:
        students.length - completeStudentSchedules,
      qualifiedTeacherCount: new Set(
        teachers
          .filter((qualification) => qualification.teacherProfile.user.isActive)
          .map((qualification) => qualification.teacherProfile.userId),
      ).size,
      qualificationCount: teachers.length,
      requirementCount: requirements.length,
    });

    const run = await this.prisma.schedulingRun.create({
      data: {
        instituteId,
        termId: input.termId,
        branchId,
        requestedByUserId: currentUser.sub,
        sourceRunId: input.sourceRunId ?? null,
        status: preflightReport.passed ? 'QUEUED' : 'PREFLIGHT_FAILED',
        inputSnapshot,
        settingsSnapshot,
        preflightReport: this.toJson(preflightReport),
        failureCode: preflightReport.passed ? null : 'PREFLIGHT_BLOCKED',
        failureMessage: preflightReport.passed
          ? null
          : this.i18n.t('scheduling.preflightBlocked', locale),
        completedAt: preflightReport.passed ? null : capturedAt,
        ...(preflightReport.passed
          ? {
              plans: {
                create: {
                  instituteId,
                  status: 'DRAFT' as const,
                  rank: 1,
                  isRecommended: true,
                  earnedWeightedPoints: 0,
                  applicableWeightedPoints: 0,
                  qualityIndex: null,
                  coveragePercent: null,
                  minimumCourseCoveragePercent: null,
                  scoreBreakdown: {
                    criteria: [],
                    earnedWeightedPoints: 0,
                    applicableWeightedPoints: 0,
                    qualityIndex: null,
                  },
                  metricsSnapshot: { generationStatus: 'PENDING_ENGINE' },
                  weightsSnapshot: DEFAULT_SCHEDULING_SETTINGS.weights,
                  timeGroupsSnapshot: DEFAULT_SCHEDULING_SETTINGS.timeGroups,
                  dataCompletenessSnapshot,
                  warnings: [
                    {
                      code: 'GENERATION_PENDING',
                      severity: 'INFO',
                      scope: 'PLAN',
                      context: { engineStartsAtTask: 'MVP-017' },
                    },
                  ],
                  formulaVersion: DEFAULT_SCHEDULING_SETTINGS.formulaVersion,
                },
              },
            }
          : {}),
      },
      include: { plans: true },
    });

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'SCHEDULING',
      entityId: run.id,
      action: preflightReport.passed
        ? 'GENERATE_REQUESTED'
        : 'PREFLIGHT_FAILED',
      metadata: {
        termId: input.termId,
        branchId,
        requirementIds: input.requirementIds,
        sourceRunId: input.sourceRunId ?? null,
        planId: run.plans[0]?.id,
      },
    });

    if (preflightReport.passed) {
      this.generationDispatcher.wake();
    }

    return SchedulingRunSchema.parse(run);
  }

  private async validateRegeneration(
    instituteId: string,
    input: GenerateSchedulingPlanInput,
    branchId: string | null,
    locale: SupportedLocale,
  ): Promise<{ lockedProposalIds: string[] }> {
    if (input.lockedProposalIds.length > 0 && !input.sourceRunId) {
      throw new BadRequestException(
        this.i18n.t('scheduling.sourceRunRequiredForLocks', locale),
      );
    }

    if (!input.sourceRunId) {
      return { lockedProposalIds: [] };
    }

    const sourceRun = await this.prisma.schedulingRun.findFirst({
      where: {
        id: input.sourceRunId,
        instituteId,
        termId: input.termId,
      },
      select: { id: true, branchId: true },
    });
    if (!sourceRun || sourceRun.branchId !== branchId) {
      throw new BadRequestException(
        this.i18n.t('scheduling.invalidSourceRun', locale),
      );
    }

    if (input.lockedProposalIds.length === 0) {
      return { lockedProposalIds: [] };
    }

    const lockedProposals = await this.prisma.schedulingProposal.findMany({
      where: {
        id: { in: input.lockedProposalIds },
        instituteId,
        isLocked: true,
        plan: { runId: sourceRun.id },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    if (lockedProposals.length !== input.lockedProposalIds.length) {
      throw new BadRequestException(
        this.i18n.t('scheduling.invalidLockedProposals', locale),
      );
    }

    return {
      lockedProposalIds: lockedProposals.map((proposal) => proposal.id),
    };
  }

  private resolveInstituteId(
    currentUser: JwtPayload,
    requestedInstituteId: string | undefined,
    locale: SupportedLocale,
  ): string {
    if (currentUser.role === ROLES.SUPER_ADMIN) {
      if (!requestedInstituteId) {
        throw new BadRequestException(
          this.i18n.t('scheduling.instituteRequired', locale),
        );
      }

      return requestedInstituteId;
    }

    return currentUser.instituteId;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
