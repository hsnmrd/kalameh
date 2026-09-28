import { Injectable } from '@nestjs/common';
import {
  SchedulingEngineInputSnapshotSchema,
  SchedulingEngineSettingsSnapshotSchema,
  type ClassDeliveryMode,
  type SchedulingNewTeacherHiringPlan,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import {
  SchedulingNewTeacherScheduleOptimizerService,
  type NewTeacherHiringWorkItem,
} from './scheduling-new-teacher-schedule-optimizer.service';
import type { SchedulingRecoveryPlanProposal } from './scheduling-recovery-option-builder.service';

type HiringPlanUnresolvedRequirement = {
  classRequirementId?: string | null;
  missingClassCount: number;
  classRequirement: {
    id: string;
    courseId: string;
    capacity: number;
    deliveryMode: ClassDeliveryMode;
    course: { id: string; title: string };
  } | null;
};

type BuildHiringPlanInput = {
  instituteId: string;
  inputSnapshot: unknown;
  settingsSnapshot: unknown;
  proposals: SchedulingRecoveryPlanProposal[];
  unresolvedRequirements: HiringPlanUnresolvedRequirement[];
};

@Injectable()
export class SchedulingNewTeacherHiringPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly optimizer: SchedulingNewTeacherScheduleOptimizerService,
  ) {}

  async build(
    input: BuildHiringPlanInput,
  ): Promise<SchedulingNewTeacherHiringPlan | null> {
    if (input.unresolvedRequirements.length === 0) return null;

    const snapshot = SchedulingEngineInputSnapshotSchema.parse(
      input.inputSnapshot,
    );
    const settings = SchedulingEngineSettingsSnapshotSchema.parse(
      input.settingsSnapshot,
    );
    const [term, classroomReferences] = await Promise.all([
      this.prisma.term.findFirstOrThrow({
        where: { id: snapshot.term.id, instituteId: input.instituteId },
        select: {
          operatingPhase: {
            select: {
              startTime: true,
              endTime: true,
              slotDurationMinutes: true,
              daysOfWeek: true,
              hasBreak: true,
              breakStartTime: true,
              breakEndTime: true,
            },
          },
        },
      }),
      this.prisma.classroom.findMany({
        where: {
          id: { in: snapshot.classrooms.map(({ id }) => id) },
          instituteId: input.instituteId,
        },
        select: { id: true, name: true, capacity: true },
      }),
    ]);
    if (!term.operatingPhase) return null;

    const requirementsById = new Map(
      snapshot.requirements.map((requirement) => [requirement.id, requirement]),
    );
    const workItems = input.unresolvedRequirements.flatMap((unresolved) => {
      const reference = unresolved.classRequirement;
      const requirement = reference
        ? requirementsById.get(reference.id)
        : undefined;
      if (!reference || !requirement) return [];

      return Array.from(
        { length: unresolved.missingClassCount },
        (_, index): NewTeacherHiringWorkItem => ({
          key: `${requirement.id}:${index + 1}`,
          requirementId: requirement.id,
          course: reference.course,
          classNumber: index + 1,
          branchId: requirement.branchId,
          capacity: requirement.capacity,
          durationMinutes: requirement.sessionDurationMinutes,
          deliveryMode: requirement.deliveryMode,
        }),
      );
    });
    const expectedClassCount = input.unresolvedRequirements.reduce(
      (sum, unresolved) => sum + unresolved.missingClassCount,
      0,
    );
    if (workItems.length !== expectedClassCount) return null;

    const classroomById = new Map(
      classroomReferences.map((classroom) => [classroom.id, classroom]),
    );
    const classrooms = snapshot.classrooms.flatMap((classroom) => {
      const reference = classroomById.get(classroom.id);
      return reference ? [{ ...classroom, ...reference }] : [];
    });
    const scheduledClasses = [
      ...snapshot.existingClasses,
      ...input.proposals.map((proposal) => ({
        classroomId: proposal.classroomId ?? null,
        daysOfWeek: proposal.daysOfWeek,
        sessionDates: [],
        startTime: proposal.startTime,
        endTime: proposal.endTime,
      })),
    ];

    return this.optimizer.optimize({
      workItems,
      settings,
      operatingPhase: term.operatingPhase,
      classrooms,
      scheduledClasses,
    });
  }
}
