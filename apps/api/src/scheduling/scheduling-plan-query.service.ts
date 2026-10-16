import { BadRequestException, Injectable } from '@nestjs/common';
import {
  calculatePhaseSlots,
  ROLES,
  SchedulingEngineInputSnapshotSchema,
  SchedulingPlanDetailsSchema,
  type JwtPayload,
  type SchedulingOperatingPhaseSnapshot,
  type SchedulingPlanDetailsDto,
  type SchedulingRecoveryAnalysis,
  type SupportedLocale,
} from '@workspace/types';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingRecoverySuggestionService } from './scheduling-recovery-suggestion.service';
import { SchedulingPlanTeacherCalendarService } from './scheduling-plan-teacher-calendar.service';
import { SchedulingNewTeacherHiringPlanService } from './scheduling-new-teacher-hiring-plan.service';

const requirementReferenceSelect = {
  id: true,
  courseId: true,
  requiredClassCount: true,
  capacity: true,
  deliveryMode: true,
  course: { select: { id: true, title: true } },
} as const;

const emptyRecovery = {
  options: [],
  totalOptionCount: 0,
  qualifiedTeacherCount: 0,
  compatibleClassroomCount: 0,
  busyTeachers: [],
  teacherCalendars: [],
  reassignmentChains: [],
  staffingFallback: { addTeacherSuggested: true, availabilityOptions: [] },
} as const;

@Injectable()
export class SchedulingPlanQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly recoverySuggestionService: SchedulingRecoverySuggestionService,
    private readonly planTeacherCalendarService: SchedulingPlanTeacherCalendarService,
    private readonly newTeacherHiringPlanService: SchedulingNewTeacherHiringPlanService,
  ) {}

  async findOne(
    currentUser: JwtPayload,
    planId: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<SchedulingPlanDetailsDto> {
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );
    const plan = await this.prisma.schedulingPlan.findFirstOrThrow({
      where: {
        id: planId,
        instituteId,
        run: {
          instituteId,
          status: 'COMPLETED',
          term: { instituteId },
          branch: { instituteId },
        },
        proposals: {
          every: {
            instituteId,
            course: { instituteId },
            teacher: { instituteId },
            sessions: { every: { instituteId } },
            AND: [
              { branch: { instituteId } },
              {
                OR: [{ classroomId: null }, { classroom: { instituteId } }],
              },
              {
                OR: [
                  { classRequirementId: null },
                  {
                    classRequirement: {
                      instituteId,
                      course: { instituteId },
                    },
                  },
                ],
              },
              {
                OR: [{ lockedByUserId: null }, { lockedBy: { instituteId } }],
              },
              {
                OR: [
                  { publishedClassId: null },
                  { publishedClass: { instituteId } },
                ],
              },
            ],
          },
        },
        unresolvedRequirements: {
          every: {
            instituteId,
            OR: [
              { classRequirementId: null },
              {
                classRequirement: {
                  instituteId,
                  course: { instituteId },
                },
              },
            ],
          },
        },
      },
      include: {
        run: {
          select: {
            id: true,
            status: true,
            termId: true,
            branchId: true,
            inputSnapshot: true,
            settingsSnapshot: true,
            term: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                operatingPhase: {
                  select: {
                    id: true,
                    title: true,
                    startTime: true,
                    endTime: true,
                    slotDurationMinutes: true,
                    hasBreak: true,
                    breakStartTime: true,
                    breakEndTime: true,
                    daysOfWeek: true,
                  },
                },
              },
            },
            branch: { select: { id: true, name: true } },
          },
        },
        proposals: {
          include: {
            course: { select: { id: true, title: true } },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            branch: { select: { id: true, name: true } },
            classroom: {
              select: { id: true, name: true, capacity: true },
            },
            classRequirement: { select: requirementReferenceSelect },
            lockedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            sessions: {
              orderBy: [
                { sessionDate: 'asc' },
                { startTime: 'asc' },
                { id: 'asc' },
              ],
            },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
        unresolvedRequirements: {
          include: {
            classRequirement: { select: requirementReferenceSelect },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    const unresolvedRequirementIds = plan.unresolvedRequirements.flatMap(
      ({ classRequirementId }) =>
        classRequirementId === null ? [] : [classRequirementId],
    );
    const recoveryPromise: Promise<Record<string, SchedulingRecoveryAnalysis>> =
      unresolvedRequirementIds.length === 0
        ? Promise.resolve({})
        : this.recoverySuggestionService.analyze({
            instituteId,
            inputSnapshot: plan.run.inputSnapshot,
            settingsSnapshot: plan.run.settingsSnapshot,
            proposals: plan.proposals,
            unresolvedRequirementIds,
            unresolvedRequirements: plan.unresolvedRequirements,
          });
    const [
      recoveryByRequirementId,
      teacherCalendars,
      newTeacherHiringPlan,
      branches,
      plansForTerm,
      classesForTerm,
    ] = await Promise.all([
      recoveryPromise,
      this.planTeacherCalendarService.build({
        instituteId,
        inputSnapshot: plan.run.inputSnapshot,
        proposals: plan.proposals,
      }),
      unresolvedRequirementIds.length === 0
        ? Promise.resolve(null)
        : this.newTeacherHiringPlanService.build({
            instituteId,
            inputSnapshot: plan.run.inputSnapshot,
            settingsSnapshot: plan.run.settingsSnapshot,
            proposals: plan.proposals,
            unresolvedRequirements: plan.unresolvedRequirements,
          }),
      this.prisma.branch.findMany({
        where: { instituteId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.schedulingPlan.findMany({
        where: {
          instituteId,
          run: { termId: plan.run.termId, status: 'COMPLETED' },
          status: { in: ['PUBLISHED', 'SELECTED', 'DRAFT'] },
        },
        select: {
          status: true,
          run: { select: { branchId: true } },
        },
      }),
      this.prisma.class.findMany({
        where: { instituteId, termId: plan.run.termId },
        select: { branchId: true },
      }),
    ]);
    let operatingPhaseSnapshot: SchedulingOperatingPhaseSnapshot | null = null;
    try {
      const snapshot = SchedulingEngineInputSnapshotSchema.parse(
        plan.run.inputSnapshot,
      );
      operatingPhaseSnapshot = snapshot.term?.operatingPhase ?? null;
    } catch {
      // Gracefully continue if snapshot parsing fails or is empty
    }

    const rawPhase =
      operatingPhaseSnapshot ??
      (plan.run.term?.operatingPhase
        ? {
            id: plan.run.term.operatingPhase.id,
            title: plan.run.term.operatingPhase.title,
            startTime: plan.run.term.operatingPhase.startTime,
            endTime: plan.run.term.operatingPhase.endTime,
            slotDurationMinutes:
              plan.run.term.operatingPhase.slotDurationMinutes,
            hasBreak: plan.run.term.operatingPhase.hasBreak,
            breakStartTime: plan.run.term.operatingPhase.breakStartTime,
            breakEndTime: plan.run.term.operatingPhase.breakEndTime,
            daysOfWeek: plan.run.term.operatingPhase.daysOfWeek as any,
          }
        : null);

    const availableTimeSlots = rawPhase
      ? calculatePhaseSlots(
          rawPhase.startTime,
          rawPhase.endTime,
          rawPhase.slotDurationMinutes,
          {
            hasBreak: rawPhase.hasBreak,
            breakStartTime: rawPhase.breakStartTime,
            breakEndTime: rawPhase.breakEndTime,
          },
        ).slots.map(({ startTime, endTime }) => ({ startTime, endTime }))
      : [];

    const {
      inputSnapshot: _inputSnapshot,
      settingsSnapshot: _settingsSnapshot,
      ...runData
    } = plan.run;

    const run = {
      ...runData,
      term: {
        ...runData.term,
        operatingPhase: rawPhase,
      },
    };

    const publishedBranches = new Set<string>([
      ...classesForTerm.map((c) => c.branchId),
      ...plansForTerm
        .filter((p) => p.status === 'PUBLISHED' && p.run.branchId !== null)
        .map((p) => p.run.branchId),
    ]);
    const scheduledBranches = new Set<string>(
      plansForTerm
        .filter(
          (p) =>
            (p.status === 'SELECTED' || p.status === 'DRAFT') &&
            p.run.branchId !== null,
        )
        .map((p) => p.run.branchId),
    );

    const branchScheduleStatuses = branches.map((branch) => {
      const isPublished = publishedBranches.has(branch.id);
      const isScheduled = scheduledBranches.has(branch.id);
      return {
        branchId: branch.id,
        branchName: branch.name,
        hasDefinedSchedule: isPublished || isScheduled,
        status: isPublished
          ? ('PUBLISHED' as const)
          : isScheduled
            ? ('SCHEDULED' as const)
            : ('NOT_SCHEDULED' as const),
      };
    });

    return SchedulingPlanDetailsSchema.parse({
      ...plan,
      run,
      availableTimeSlots,
      teacherCalendars,
      newTeacherHiringPlan,
      branchScheduleStatuses,
      unresolvedRequirements: plan.unresolvedRequirements.map(
        (requirement) => ({
          ...requirement,
          recovery: requirement.classRequirementId
            ? (recoveryByRequirementId[requirement.classRequirementId] ??
              emptyRecovery)
            : emptyRecovery,
        }),
      ),
    });
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
}
