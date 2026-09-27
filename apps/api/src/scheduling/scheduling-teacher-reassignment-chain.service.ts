import { Injectable } from '@nestjs/common';
import {
  SchedulingTeacherReassignmentChainSchema,
  type SchedulingFeasibleCandidate,
  type SchedulingTeacherReassignmentChain,
  type WeekDay,
} from '@workspace/types';
import type { SchedulingRecoveryPlanProposal } from './scheduling-recovery-option-builder.service';
import {
  SchedulingTeacherReassignmentValidatorService,
  type TeacherReassignmentAnalysisInput,
  type TeacherReassignmentSearchState,
} from './scheduling-teacher-reassignment-validator.service';

const MAX_REASSIGNMENTS = 3;

@Injectable()
export class SchedulingTeacherReassignmentChainService {
  constructor(
    private readonly validator: SchedulingTeacherReassignmentValidatorService,
  ) {}

  analyze(
    input: TeacherReassignmentAnalysisInput,
  ): SchedulingTeacherReassignmentChain[] {
    const proposalsById = new Map(
      input.proposals.map((proposal) => [proposal.id, proposal]),
    );
    const chains: SchedulingTeacherReassignmentChain[] = [];

    for (const candidate of input.candidates
      .filter(({ requirementId }) => requirementId === input.requirementId)
      .sort((left, right) =>
        left.assignmentKey.localeCompare(right.assignmentKey),
      )) {
      const daysOfWeek = this.validator.candidateDays(
        candidate,
        input.settings,
      );
      if (
        this.validator.hasRoomConflict(candidate, daysOfWeek, input.proposals)
      ) {
        continue;
      }
      if (!this.validator.isTargetEligible(candidate, daysOfWeek, input)) {
        continue;
      }

      const blockingProposalIds = input.proposals
        .filter(
          (proposal) =>
            proposal.teacherId === candidate.teacherId &&
            this.validator.overlaps(daysOfWeek, candidate, proposal),
        )
        .map(({ id }) => id);
      if (blockingProposalIds.length === 0) continue;

      let state: TeacherReassignmentSearchState | null = {
        assignments: new Map(
          input.proposals.map((proposal) => [proposal.id, proposal.teacherId]),
        ),
        movedProposalIds: [],
      };
      for (const proposalId of blockingProposalIds) {
        state = this.reassignProposal(
          proposalId,
          state,
          candidate,
          daysOfWeek,
          input,
          proposalsById,
          new Set(),
        );
        if (!state) break;
      }
      if (
        !state ||
        !this.validator.validate(
          state,
          candidate,
          daysOfWeek,
          input,
          proposalsById,
        )
      ) {
        continue;
      }

      const chain = this.toChain(
        state,
        candidate,
        daysOfWeek,
        input,
        proposalsById,
      );
      if (chain) chains.push(chain);
    }

    return Array.from(
      new Map(chains.map((chain) => [chain.key, chain])).values(),
    )
      .sort(
        (left, right) =>
          left.reassignments.length - right.reassignments.length ||
          left.targetAssignment.startTime.localeCompare(
            right.targetAssignment.startTime,
          ) ||
          left.key.localeCompare(right.key),
      )
      .slice(0, 4);
  }

  private reassignProposal(
    proposalId: string,
    state: TeacherReassignmentSearchState,
    target: SchedulingFeasibleCandidate,
    targetDays: WeekDay[],
    input: TeacherReassignmentAnalysisInput,
    proposalsById: Map<string, SchedulingRecoveryPlanProposal>,
    path: Set<string>,
  ): TeacherReassignmentSearchState | null {
    if (
      state.movedProposalIds.length >= MAX_REASSIGNMENTS ||
      path.has(proposalId)
    ) {
      return null;
    }
    const proposal = proposalsById.get(proposalId);
    if (!proposal || proposal.isLocked) return null;
    const currentTeacherId = state.assignments.get(proposalId);
    if (!currentTeacherId) return null;
    const nextPath = new Set(path).add(proposalId);
    const solutions: TeacherReassignmentSearchState[] = [];

    for (const teacherId of this.validator.qualifiedTeacherIds(
      proposal,
      input,
    )) {
      if (teacherId === currentTeacherId) continue;
      if (
        this.validator.conflictsWithTarget(
          teacherId,
          proposal,
          target,
          targetDays,
        )
      ) {
        continue;
      }
      let nextState: TeacherReassignmentSearchState | null =
        this.cloneState(state);
      const blockers = input.proposals.filter(
        (other) =>
          other.id !== proposal.id &&
          nextState?.assignments.get(other.id) === teacherId &&
          this.validator.overlaps(
            proposal.daysOfWeek as WeekDay[],
            proposal,
            other,
          ),
      );
      for (const blocker of blockers) {
        nextState = this.reassignProposal(
          blocker.id,
          nextState,
          target,
          targetDays,
          input,
          proposalsById,
          nextPath,
        );
        if (!nextState) break;
      }
      if (!nextState) continue;
      nextState.assignments.set(proposal.id, teacherId);
      if (!nextState.movedProposalIds.includes(proposal.id)) {
        nextState.movedProposalIds.push(proposal.id);
      }
      solutions.push(nextState);
    }
    return (
      solutions.sort(
        (left, right) =>
          left.movedProposalIds.length - right.movedProposalIds.length ||
          this.stateKey(left).localeCompare(this.stateKey(right)),
      )[0] ?? null
    );
  }

  private toChain(
    state: TeacherReassignmentSearchState,
    target: SchedulingFeasibleCandidate,
    daysOfWeek: WeekDay[],
    input: TeacherReassignmentAnalysisInput,
    proposalsById: Map<string, SchedulingRecoveryPlanProposal>,
  ): SchedulingTeacherReassignmentChain | null {
    const targetTeacher = input.teacherById.get(target.teacherId);
    if (!targetTeacher) return null;
    const targetClassroom =
      target.classroomId === null
        ? null
        : input.classroomById.get(target.classroomId);
    if (target.deliveryMode === 'IN_PERSON' && !targetClassroom) return null;
    const reassignments = state.movedProposalIds.flatMap((proposalId) => {
      const proposal = proposalsById.get(proposalId);
      const fromTeacher = proposal
        ? input.teacherById.get(proposal.teacherId)
        : undefined;
      const toTeacherId = state.assignments.get(proposalId);
      const toTeacher = toTeacherId
        ? input.teacherById.get(toTeacherId)
        : undefined;
      return proposal && fromTeacher && toTeacher
        ? [
            {
              proposalId,
              classTitle: proposal.title,
              courseId: proposal.courseId,
              fromTeacher,
              toTeacher,
              daysOfWeek: proposal.daysOfWeek as WeekDay[],
              startTime: proposal.startTime,
              endTime: proposal.endTime,
            },
          ]
        : [];
    });
    if (reassignments.length !== state.movedProposalIds.length) return null;
    const moveKey = reassignments
      .map(({ proposalId, toTeacher }) => `${proposalId}:${toTeacher.id}`)
      .join('|');
    return SchedulingTeacherReassignmentChainSchema.parse({
      key: `${target.assignmentKey}|${moveKey}`,
      targetAssignment: {
        teacher: targetTeacher,
        classroom: targetClassroom ?? null,
        deliveryMode: target.deliveryMode,
        daysOfWeek,
        startTime: target.startTime,
        endTime: target.endTime,
      },
      reassignments,
      validation: {
        allTeachersQualified: true,
        allWithinAvailability: true,
        noTeacherConflicts: true,
        targetClassroomAvailable: true,
      },
    });
  }

  private cloneState(
    state: TeacherReassignmentSearchState,
  ): TeacherReassignmentSearchState {
    return {
      assignments: new Map(state.assignments),
      movedProposalIds: [...state.movedProposalIds],
    };
  }

  private stateKey(state: TeacherReassignmentSearchState): string {
    return Array.from(state.assignments.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([proposalId, teacherId]) => `${proposalId}:${teacherId}`)
      .join('|');
  }
}
