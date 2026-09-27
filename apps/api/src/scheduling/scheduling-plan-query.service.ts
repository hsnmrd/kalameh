import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ROLES,
  SchedulingPlanDetailsSchema,
  type JwtPayload,
  type SchedulingPlanDetailsDto,
  type SchedulingRecoveryAnalysis,
  type SupportedLocale,
} from '@workspace/types';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingRecoverySuggestionService } from './scheduling-recovery-suggestion.service';
import { SchedulingPlanTeacherCalendarService } from './scheduling-plan-teacher-calendar.service';

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
  staffingFallback: {
    addTeacherSuggested: false,
    availabilityOptions: [],
  },
} as const;

@Injectable()
export class SchedulingPlanQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly recoverySuggestionService: SchedulingRecoverySuggestionService,
    private readonly planTeacherCalendarService: SchedulingPlanTeacherCalendarService,
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
          OR: [{ branchId: null }, { branch: { instituteId } }],
        },
        proposals: {
          every: {
            instituteId,
            course: { instituteId },
            teacher: { instituteId },
            sessions: { every: { instituteId } },
            AND: [
              {
                OR: [{ branchId: null }, { branch: { instituteId } }],
              },
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
          });
    const [recoveryByRequirementId, teacherCalendars] = await Promise.all([
      recoveryPromise,
      this.planTeacherCalendarService.build({
        instituteId,
        inputSnapshot: plan.run.inputSnapshot,
        proposals: plan.proposals,
      }),
    ]);
    const {
      inputSnapshot: _inputSnapshot,
      settingsSnapshot: _settingsSnapshot,
      ...run
    } = plan.run;

    return SchedulingPlanDetailsSchema.parse({
      ...plan,
      run,
      teacherCalendars,
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
