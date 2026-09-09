import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@workspace/database';
import {
  ROLES,
  SchedulingPlanValidationSchema,
  type JwtPayload,
  type SchedulingPlanValidation,
  type SchedulingPlanValidationViolation,
  type SupportedLocale,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';

type Schedule = {
  id: string;
  teacherId: string | null;
  classroomId: string | null;
  daysOfWeek: string[];
  sessionDates?: Array<string | Date>;
  sessions?: Array<{ sessionDate: string | Date }>;
  startTime: string | null;
  endTime: string | null;
};

type ValidationDatabase = Pick<
  Prisma.TransactionClient,
  'schedulingPlan' | 'class'
>;

@Injectable()
export class SchedulingPlanValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
    private readonly i18n: I18nService,
  ) {}

  async validate(
    currentUser: JwtPayload,
    planId: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
    validatedAt = new Date(),
    database: ValidationDatabase = this.prisma,
    writeAuditLog = true,
  ): Promise<SchedulingPlanValidation> {
    if (Number.isNaN(validatedAt.getTime())) {
      throw new RangeError('validation timestamp must be valid');
    }
    const instituteId = this.resolveInstituteId(
      currentUser,
      requestedInstituteId,
      locale,
    );
    const plan = await database.schedulingPlan.findFirstOrThrow({
      where: {
        id: planId,
        instituteId,
        status: 'SELECTED',
        run: { instituteId, status: 'COMPLETED' },
      },
      select: {
        id: true,
        run: {
          select: {
            termId: true,
            branchId: true,
            term: {
              select: {
                instituteId: true,
                startDate: true,
                endDate: true,
                isActive: true,
              },
            },
          },
        },
        proposals: {
          select: {
            id: true,
            instituteId: true,
            classRequirementId: true,
            courseId: true,
            branchId: true,
            teacherId: true,
            classroomId: true,
            capacity: true,
            deliveryMode: true,
            daysOfWeek: true,
            startTime: true,
            endTime: true,
            publishedClassId: true,
            course: { select: { instituteId: true } },
            branch: { select: { instituteId: true, isActive: true } },
            classroom: {
              select: {
                instituteId: true,
                branchId: true,
                capacity: true,
                isActive: true,
              },
            },
            teacher: {
              select: {
                instituteId: true,
                role: true,
                isActive: true,
                branchId: true,
                teacherProfile: {
                  select: {
                    availabilities: {
                      select: {
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                      },
                    },
                    teachableCourses: {
                      select: { id: true, instituteId: true, courseId: true },
                    },
                  },
                },
              },
            },
            classRequirement: {
              select: {
                instituteId: true,
                termId: true,
                courseId: true,
                branchId: true,
                requiredClassCount: true,
                capacity: true,
                sessionDurationMinutes: true,
                sessionsPerWeek: true,
                totalSessions: true,
                deliveryMode: true,
                isActive: true,
              },
            },
            sessions: {
              select: {
                id: true,
                instituteId: true,
                sessionDate: true,
                startTime: true,
                endTime: true,
              },
              orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }],
            },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
    const existingClasses = await database.class.findMany({
      where: { instituteId, termId: plan.run.termId },
      select: {
        id: true,
        teacherId: true,
        classroomId: true,
        daysOfWeek: true,
        sessionDates: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { id: 'asc' },
    });
    const violations: SchedulingPlanValidationViolation[] = [];
    const add = (
      code: SchedulingPlanValidationViolation['code'],
      proposalId: string | null,
      conflictingEntityIds: string[] = [],
      context: Record<string, unknown> = {},
    ) => {
      const violation = {
        code,
        scope: proposalId ? ('PROPOSAL' as const) : ('PLAN' as const),
        proposalId,
        conflictingEntityIds: [...new Set(conflictingEntityIds)].sort(),
        context,
      };
      const key = JSON.stringify(violation);
      if (!violations.some((item) => JSON.stringify(item) === key)) {
        violations.push(violation);
      }
    };

    if (!plan.run.term.isActive || plan.run.term.instituteId !== instituteId) {
      add('INVALID_OR_INACTIVE_REFERENCE', null);
    }
    if (plan.proposals.length === 0) {
      add('INCOMPLETE_CLASS_REQUIREMENT', null, [], {
        reason: 'PLAN_HAS_NO_PROPOSALS',
      });
    }
    for (const proposal of plan.proposals) {
      const relationInstituteIds = [
        proposal.instituteId,
        proposal.course.instituteId,
        proposal.teacher.instituteId,
        proposal.branch?.instituteId,
        proposal.classroom?.instituteId,
        proposal.classRequirement?.instituteId,
        ...proposal.sessions.map((session) => session.instituteId),
        ...(proposal.teacher.teacherProfile?.teachableCourses.map(
          (qualification) => qualification.instituteId,
        ) ?? []),
      ].filter((value): value is string => value !== undefined);
      if (relationInstituteIds.some((value) => value !== instituteId)) {
        add('CROSS_INSTITUTE_REFERENCE', proposal.id);
      }
      const requirement = proposal.classRequirement;
      if (
        !requirement ||
        !requirement.isActive ||
        requirement.termId !== plan.run.termId ||
        requirement.courseId !== proposal.courseId ||
        requirement.branchId !== proposal.branchId ||
        requirement.deliveryMode !== proposal.deliveryMode
      ) {
        add('INCOMPLETE_CLASS_REQUIREMENT', proposal.id);
      }
      if (
        !proposal.teacher.isActive ||
        proposal.teacher.role !== 'TEACHER' ||
        (proposal.branchId &&
          proposal.teacher.branchId &&
          proposal.teacher.branchId !== proposal.branchId)
      ) {
        add('INVALID_TEACHER', proposal.id, [proposal.teacherId]);
      }
      const qualified =
        proposal.teacher.teacherProfile?.teachableCourses.some(
          (qualification) => qualification.courseId === proposal.courseId,
        ) ?? false;
      if (!qualified) {
        add('TEACHER_NOT_QUALIFIED', proposal.id, [proposal.teacherId]);
      }
      if (
        !proposal.startTime ||
        !proposal.endTime ||
        proposal.startTime >= proposal.endTime ||
        (requirement &&
          this.durationMinutes(proposal.startTime, proposal.endTime) !==
            requirement.sessionDurationMinutes)
      ) {
        add('INVALID_TIME_RANGE', proposal.id);
      }
      const uncoveredDays = proposal.daysOfWeek.filter(
        (day) =>
          !proposal.teacher.teacherProfile?.availabilities.some(
            (availability) =>
              availability.dayOfWeek === day &&
              availability.startTime <= proposal.startTime &&
              availability.endTime >= proposal.endTime,
          ),
      );
      if (uncoveredDays.length > 0) {
        add('OUTSIDE_TEACHER_AVAILABILITY', proposal.id, [], {
          daysOfWeek: uncoveredDays,
        });
      }
      if (
        (proposal.deliveryMode === 'ONLINE' && proposal.classroomId) ||
        (proposal.deliveryMode === 'IN_PERSON' &&
          (!proposal.classroom ||
            !proposal.classroom.isActive ||
            (proposal.branchId &&
              proposal.classroom.branchId &&
              proposal.classroom.branchId !== proposal.branchId))) ||
        (proposal.branch && !proposal.branch.isActive)
      ) {
        add('INVALID_DELIVERY_LOCATION', proposal.id);
      }
      if (
        proposal.classroom &&
        proposal.classroom.capacity < proposal.capacity
      ) {
        add('INSUFFICIENT_CLASSROOM_CAPACITY', proposal.id, [
          proposal.classroomId!,
        ]);
      }
      if (requirement) {
        if (
          (requirement.sessionsPerWeek !== null &&
            proposal.daysOfWeek.length !== requirement.sessionsPerWeek) ||
          (requirement.totalSessions !== null &&
            proposal.sessions.length !== requirement.totalSessions)
        ) {
          add('REQUIREMENT_CADENCE_MISMATCH', proposal.id);
        }
        if (proposal.capacity !== requirement.capacity) {
          add('INCOMPLETE_CLASS_REQUIREMENT', proposal.id);
        }
      }
      const sessionKeys = proposal.sessions.map(
        (session) =>
          `${this.dateKey(session.sessionDate)}:${session.startTime}`,
      );
      if (
        new Set(sessionKeys).size !== sessionKeys.length ||
        proposal.sessions.some((session) => {
          const date = new Date(session.sessionDate);
          return (
            Number.isNaN(date.getTime()) ||
            session.startTime !== proposal.startTime ||
            session.endTime !== proposal.endTime ||
            !proposal.daysOfWeek.includes(this.dayOfWeek(date))
          );
        })
      ) {
        add('INVALID_SESSION_DATES', proposal.id);
      }
      if (
        proposal.sessions.some((session) => {
          const date = new Date(session.sessionDate);
          return (
            this.dateKey(date) < this.dateKey(plan.run.term.startDate) ||
            this.dateKey(date) > this.dateKey(plan.run.term.endDate)
          );
        })
      ) {
        add('SESSION_OUTSIDE_TERM', proposal.id);
      }

      for (const existingClass of existingClasses) {
        if (!this.hasOverlap(proposal, existingClass)) continue;
        if (existingClass.teacherId === proposal.teacherId) {
          add('TEACHER_TIME_CONFLICT', proposal.id, [existingClass.id]);
        }
        if (
          proposal.classroomId &&
          existingClass.classroomId === proposal.classroomId
        ) {
          add('CLASSROOM_TIME_CONFLICT', proposal.id, [existingClass.id]);
        }
      }
    }

    const proposalCountsByRequirement = new Map<string, number>();
    for (const proposal of plan.proposals) {
      if (!proposal.classRequirementId || !proposal.classRequirement) continue;
      const count =
        (proposalCountsByRequirement.get(proposal.classRequirementId) ?? 0) + 1;
      proposalCountsByRequirement.set(proposal.classRequirementId, count);
      if (count > proposal.classRequirement.requiredClassCount) {
        add('REQUIREMENT_CADENCE_MISMATCH', proposal.id, [], {
          requiredClassCount: proposal.classRequirement.requiredClassCount,
          proposedClassCount: count,
        });
      }
    }

    for (let left = 0; left < plan.proposals.length; left += 1) {
      for (let right = left + 1; right < plan.proposals.length; right += 1) {
        const first = plan.proposals[left];
        const second = plan.proposals[right];
        if (!this.hasOverlap(first, second)) continue;
        if (first.teacherId === second.teacherId) {
          add('TEACHER_TIME_CONFLICT', first.id, [second.id]);
          add('TEACHER_TIME_CONFLICT', second.id, [first.id]);
        }
        if (first.classroomId && first.classroomId === second.classroomId) {
          add('CLASSROOM_TIME_CONFLICT', first.id, [second.id]);
          add('CLASSROOM_TIME_CONFLICT', second.id, [first.id]);
        }
      }
    }

    violations.sort(
      (left, right) =>
        (left.proposalId ?? '').localeCompare(right.proposalId ?? '') ||
        left.code.localeCompare(right.code),
    );
    const result = SchedulingPlanValidationSchema.parse({
      planId,
      isValid: violations.length === 0,
      validatedAt,
      violations,
      summary: {
        proposalCount: plan.proposals.length,
        violationCount: violations.length,
        invalidProposalCount: new Set(
          violations.flatMap(({ proposalId }) =>
            proposalId ? [proposalId] : [],
          ),
        ).size,
      },
    });
    if (writeAuditLog) {
      await this.auditLogsService.log({
        instituteId,
        userId: currentUser.sub,
        module: 'SCHEDULING',
        entityId: planId,
        action: result.isValid
          ? 'PLAN_VALIDATION_PASSED'
          : 'PLAN_VALIDATION_FAILED',
        metadata: result.summary,
      });
    }
    return result;
  }

  private hasOverlap(left: Schedule, right: Schedule): boolean {
    if (
      !left.startTime ||
      !left.endTime ||
      !right.startTime ||
      !right.endTime ||
      left.startTime >= right.endTime ||
      right.startTime >= left.endTime
    ) {
      return false;
    }
    const leftSessionDates = this.sessionDates(left);
    const rightSessionDates = this.sessionDates(right);
    const leftDates = leftSessionDates.map((date) => this.dateKey(date));
    const rightDates = rightSessionDates.map((date) => this.dateKey(date));
    if (leftDates.length && rightDates.length) {
      const rightSet = new Set(rightDates);
      return leftDates.some((date) => rightSet.has(date));
    }
    if (leftDates.length) {
      const rightDays = new Set(right.daysOfWeek);
      return leftSessionDates.some((date) =>
        rightDays.has(this.dayOfWeek(new Date(date))),
      );
    }
    if (rightDates.length) {
      const leftDays = new Set(left.daysOfWeek);
      return rightSessionDates.some((date) =>
        leftDays.has(this.dayOfWeek(new Date(date))),
      );
    }
    const rightDays = new Set(right.daysOfWeek);
    return left.daysOfWeek.some((day) => rightDays.has(day));
  }

  private durationMinutes(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    return endHour * 60 + endMinute - (startHour * 60 + startMinute);
  }

  private dateKey(value: string | Date): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? `INVALID:${String(value)}`
      : date.toISOString().slice(0, 10);
  }

  private sessionDates(schedule: Schedule): Array<string | Date> {
    return (
      schedule.sessionDates ??
      schedule.sessions?.map(({ sessionDate }) => sessionDate) ??
      []
    );
  }

  private dayOfWeek(value: Date): string {
    return [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][value.getUTCDay()];
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
