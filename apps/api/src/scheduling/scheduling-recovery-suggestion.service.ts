import { Injectable } from '@nestjs/common';
import {
  SchedulingEngineInputSnapshotSchema,
  SchedulingEngineSettingsSnapshotSchema,
  SchedulingRecoveryAnalysisSchema,
  type SchedulingEngineSettingsSnapshot,
  type SchedulingFeasibleCandidate,
  type SchedulingRecoveryAnalysis,
  type SchedulingRecoveryOption,
  type WeekDay,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';

type PlanProposal = {
  id: string;
  title: string;
  teacherId: string;
  classroomId?: string | null;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
};

type RecoveryInput = {
  instituteId: string;
  inputSnapshot: unknown;
  settingsSnapshot: unknown;
  proposals: PlanProposal[];
  unresolvedRequirementIds: string[];
};

type CandidateGroup = {
  candidate: SchedulingFeasibleCandidate;
  assignments: SchedulingFeasibleCandidate[];
};

@Injectable()
export class SchedulingRecoverySuggestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidateSlotService: SchedulingCandidateSlotService,
    private readonly hardConstraintService: SchedulingHardConstraintService,
  ) {}

  async analyze(
    input: RecoveryInput,
  ): Promise<Record<string, SchedulingRecoveryAnalysis>> {
    const snapshot = SchedulingEngineInputSnapshotSchema.parse(
      input.inputSnapshot,
    );
    const settings = SchedulingEngineSettingsSnapshotSchema.parse(
      input.settingsSnapshot,
    );
    const requirementIds = new Set(input.unresolvedRequirementIds);
    const requirements = snapshot.requirements.filter(({ id }) =>
      requirementIds.has(id),
    );
    const candidates = this.candidateSlotService.generate({
      requirements,
      qualifications: snapshot.teachers,
      timeGroups: settings.timeGroups,
      stepMinutes: settings.generation.candidateStepMinutes,
    });
    const planClasses = input.proposals.map((proposal) => ({
      id: proposal.id,
      teacherId: proposal.teacherId,
      classroomId: proposal.classroomId ?? null,
      daysOfWeek: proposal.daysOfWeek,
      sessionDates: [],
      startTime: proposal.startTime,
      endTime: proposal.endTime,
    }));
    const baseEvaluation = this.hardConstraintService.evaluate({
      candidates,
      requirements,
      qualifications: snapshot.teachers,
      classrooms: snapshot.classrooms,
      existingClasses: snapshot.existingClasses,
    });
    const currentEvaluation = this.hardConstraintService.evaluate({
      candidates,
      requirements,
      qualifications: snapshot.teachers,
      classrooms: snapshot.classrooms,
      existingClasses: [...snapshot.existingClasses, ...planClasses],
    });
    const teacherIds = Array.from(
      new Set(
        snapshot.teachers.map(({ teacherProfile }) => teacherProfile.userId),
      ),
    );
    const classroomIds = snapshot.classrooms.map(({ id }) => id);
    const [teachers, classrooms] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: teacherIds }, instituteId: input.instituteId },
        select: { id: true, firstName: true, lastName: true },
      }),
      this.prisma.classroom.findMany({
        where: { id: { in: classroomIds }, instituteId: input.instituteId },
        select: { id: true, name: true, capacity: true },
      }),
    ]);
    const teacherById = new Map(
      teachers.map((teacher) => [teacher.id, teacher]),
    );
    const classroomById = new Map(classrooms.map((room) => [room.id, room]));
    const baseGroups = this.groupCandidates(baseEvaluation.accepted);
    const currentGroups = this.groupCandidates(currentEvaluation.accepted);

    return Object.fromEntries(
      requirements.map((requirement) => {
        const qualifiedTeacherCount = new Set(
          snapshot.teachers
            .filter(({ courseId }) => courseId === requirement.courseId)
            .map(({ teacherProfile }) => teacherProfile.userId),
        ).size;
        const compatibleClassroomCount =
          requirement.deliveryMode === 'ONLINE'
            ? 0
            : snapshot.classrooms.filter(
                (room) =>
                  room.isActive &&
                  room.capacity >= requirement.capacity &&
                  (requirement.branchId === null ||
                    room.branchId === null ||
                    room.branchId === requirement.branchId),
              ).length;
        const options = this.optionsForRequirement({
          requirementId: requirement.id,
          baseGroups,
          currentGroups,
          proposals: input.proposals,
          settings,
          teacherById,
          classroomById,
        });

        return [
          requirement.id,
          SchedulingRecoveryAnalysisSchema.parse({
            options: options.slice(0, 6),
            totalOptionCount: options.length,
            qualifiedTeacherCount,
            compatibleClassroomCount,
          }),
        ];
      }),
    );
  }

  private optionsForRequirement(input: {
    requirementId: string;
    baseGroups: Map<string, CandidateGroup>;
    currentGroups: Map<string, CandidateGroup>;
    proposals: PlanProposal[];
    settings: SchedulingEngineSettingsSnapshot;
    teacherById: Map<
      string,
      { id: string; firstName: string; lastName: string }
    >;
    classroomById: Map<string, { id: string; name: string; capacity: number }>;
  }): SchedulingRecoveryOption[] {
    const options: SchedulingRecoveryOption[] = [];
    for (const group of input.baseGroups.values()) {
      if (group.candidate.requirementId !== input.requirementId) continue;
      const teacher = input.teacherById.get(group.candidate.teacherId);
      if (!teacher) continue;
      const current = input.currentGroups.get(group.candidate.key);
      const blockingClasses = current
        ? []
        : this.blockingClasses(group, input.proposals, input.settings);
      const availableClassrooms = (current?.assignments ?? group.assignments)
        .filter(
          ({ classroomId }) =>
            classroomId !== null &&
            !blockingClasses.some(
              (blocking) =>
                blocking.conflictTypes.includes('CLASSROOM') &&
                input.proposals.find(({ id }) => id === blocking.id)
                  ?.classroomId === classroomId,
            ),
        )
        .map(({ classroomId }) => input.classroomById.get(classroomId!))
        .filter((room): room is NonNullable<typeof room> => room !== undefined);

      options.push({
        key: group.candidate.key,
        status: current ? 'AVAILABLE_NOW' : 'REQUIRES_PLAN_CHANGE',
        deliveryMode: group.candidate.deliveryMode,
        daysOfWeek: this.candidateDays(
          group.candidate.timeGroup,
          input.settings,
        ),
        startTime: group.candidate.startTime,
        endTime: group.candidate.endTime,
        teacher,
        availableClassrooms: this.uniqueById(availableClassrooms),
        blockingClasses,
      });
    }

    return options.sort(
      (left, right) =>
        left.status.localeCompare(right.status) ||
        left.blockingClasses.length - right.blockingClasses.length ||
        left.startTime.localeCompare(right.startTime) ||
        left.key.localeCompare(right.key),
    );
  }

  private groupCandidates(
    candidates: SchedulingFeasibleCandidate[],
  ): Map<string, CandidateGroup> {
    const groups = new Map<string, CandidateGroup>();
    for (const candidate of candidates) {
      const group = groups.get(candidate.key);
      if (group) group.assignments.push(candidate);
      else groups.set(candidate.key, { candidate, assignments: [candidate] });
    }
    return groups;
  }

  private blockingClasses(
    group: CandidateGroup,
    proposals: PlanProposal[],
    settings: SchedulingEngineSettingsSnapshot,
  ): SchedulingRecoveryOption['blockingClasses'] {
    const days = this.candidateDays(group.candidate.timeGroup, settings);
    const classroomIds = new Set(
      group.assignments.flatMap(({ classroomId }) =>
        classroomId === null ? [] : [classroomId],
      ),
    );
    return proposals.flatMap((proposal) => {
      if (!this.overlaps(days, group.candidate, proposal)) return [];
      const conflictTypes: Array<'TEACHER' | 'CLASSROOM'> = [];
      if (proposal.teacherId === group.candidate.teacherId) {
        conflictTypes.push('TEACHER');
      }
      if (proposal.classroomId && classroomIds.has(proposal.classroomId)) {
        conflictTypes.push('CLASSROOM');
      }
      return conflictTypes.length === 0
        ? []
        : [{ id: proposal.id, title: proposal.title, conflictTypes }];
    });
  }

  private overlaps(
    days: WeekDay[],
    candidate: SchedulingFeasibleCandidate,
    proposal: PlanProposal,
  ): boolean {
    return (
      days.some((day) => proposal.daysOfWeek.includes(day)) &&
      candidate.startTime < proposal.endTime &&
      proposal.startTime < candidate.endTime
    );
  }

  private candidateDays(
    timeGroup: SchedulingFeasibleCandidate['timeGroup'],
    settings: SchedulingEngineSettingsSnapshot,
  ): WeekDay[] {
    if (timeGroup.startsWith('EVEN')) return [...settings.timeGroups.evenDays];
    if (timeGroup.startsWith('ODD')) return [...settings.timeGroups.oddDays];
    return [...settings.timeGroups.neutralDays];
  }

  private uniqueById<T extends { id: string }>(items: T[]): T[] {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }
}
