import { Injectable } from '@nestjs/common';
import {
  SchedulingEngineInputSnapshotSchema,
  SchedulingEngineSettingsSnapshotSchema,
  SchedulingRecoveryAnalysisSchema,
  type SchedulingRecoveryAnalysis,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import {
  SchedulingRecoveryOptionBuilderService,
  type SchedulingRecoveryPlanProposal,
} from './scheduling-recovery-option-builder.service';
import { SchedulingTeacherCalendarService } from './scheduling-teacher-calendar.service';
import { SchedulingTeacherAvailabilityExpansionService } from './scheduling-teacher-availability-expansion.service';
import {
  appendOutreachAvailabilitiesToQualifications,
  mergeAcceptedOutreachIntoOptions,
  readAcceptedOutreachRecords,
} from './scheduling-teacher-outreach.types';
import { SchedulingTeacherReassignmentChainService } from './scheduling-teacher-reassignment-chain.service';

type RecoveryInput = {
  instituteId: string;
  inputSnapshot: unknown;
  settingsSnapshot: unknown;
  proposals: SchedulingRecoveryPlanProposal[];
  unresolvedRequirementIds: string[];
  unresolvedRequirements?: Array<{
    classRequirementId?: string | null;
    missingClassCount: number;
    details?: unknown;
  }>;
};

@Injectable()
export class SchedulingRecoverySuggestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidateSlotService: SchedulingCandidateSlotService,
    private readonly hardConstraintService: SchedulingHardConstraintService,
    private readonly teacherCalendarService: SchedulingTeacherCalendarService,
    private readonly teacherAvailabilityExpansionService: SchedulingTeacherAvailabilityExpansionService,
    private readonly optionBuilderService: SchedulingRecoveryOptionBuilderService,
    private readonly reassignmentChainService: SchedulingTeacherReassignmentChainService,
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
    const planClasses = input.proposals.map((proposal) => ({
      id: proposal.id,
      teacherId: proposal.teacherId,
      classroomId: proposal.classroomId ?? null,
      daysOfWeek: proposal.daysOfWeek,
      sessionDates: [],
      startTime: proposal.startTime,
      endTime: proposal.endTime,
    }));
    const teacherIds = Array.from(
      new Set(
        snapshot.teachers.map(({ teacherProfile }) => teacherProfile.userId),
      ),
    );
    const classroomIds = snapshot.classrooms.map(({ id }) => id);
    const [teachers, classrooms, existingClasses, term, courses = []] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { id: { in: teacherIds }, instituteId: input.instituteId },
          select: { id: true, firstName: true, lastName: true },
        }),
        this.prisma.classroom.findMany({
          where: { id: { in: classroomIds }, instituteId: input.instituteId },
          select: { id: true, name: true, capacity: true },
        }),
        this.prisma.class.findMany({
          where: {
            id: { in: snapshot.existingClasses.map(({ id }) => id) },
            instituteId: input.instituteId,
          },
          select: { id: true, title: true },
        }),
        this.prisma.term.findFirst({
          where: { id: snapshot.term.id, instituteId: input.instituteId },
          select: {
            operatingPhase: {
              select: {
                id: true,
                title: true,
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
        this.prisma.course?.findMany
          ? this.prisma.course.findMany({
              where: { instituteId: input.instituteId },
              select: { id: true, title: true, prerequisiteId: true },
            })
          : Promise.resolve([]),
      ]);
    const operatingPhase = snapshot.term.operatingPhase ?? term?.operatingPhase;
    const candidates = operatingPhase
      ? this.candidateSlotService.generate({
          requirements,
          qualifications: snapshot.teachers,
          timeGroups: settings.timeGroups,
          operatingPhase,
        })
      : [];
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
    const teacherById = new Map(
      teachers.map((teacher) => [teacher.id, teacher]),
    );
    const classroomById = new Map(classrooms.map((room) => [room.id, room]));
    const existingClassTitles = new Map(
      existingClasses.map((existingClass) => [
        existingClass.id,
        existingClass.title,
      ]),
    );
    const proposalIds = new Set(input.proposals.map(({ id }) => id));
    const unresolvedByReqId = new Map(
      (input.unresolvedRequirements ?? [])
        .filter((item) => Boolean(item.classRequirementId))
        .map((item) => [item.classRequirementId!, item]),
    );

    return Object.fromEntries(
      requirements.map((requirement) => {
        const unresolvedItem = unresolvedByReqId.get(requirement.id);
        const acceptedRecords = readAcceptedOutreachRecords(
          unresolvedItem?.details,
        ).filter((rec) => proposalIds.has(rec.proposalId));
        const acceptedProposalIds = new Set(
          acceptedRecords.map((rec) => rec.proposalId),
        );
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
        const recovery = this.optionBuilderService.build({
          requirementId: requirement.id,
          baseCandidates: baseEvaluation.accepted,
          currentCandidates: currentEvaluation.accepted,
          proposals: input.proposals,
          settings,
          teacherById,
          classroomById,
        });
        const reassignmentChains = this.reassignmentChainService.analyze({
          requirementId: requirement.id,
          candidates: baseEvaluation.accepted,
          snapshot,
          settings,
          proposals: input.proposals,
          teacherById,
          classroomById,
        });
        const chainTeacherIds = reassignmentChains.flatMap((chain) => [
          chain.targetAssignment.teacher.id,
          ...chain.reassignments.flatMap(({ fromTeacher, toTeacher }) => [
            fromTeacher.id,
            toTeacher.id,
          ]),
        ]);
        const outreachProposals =
          (unresolvedItem?.missingClassCount ?? 1) === 0 &&
          acceptedProposalIds.size > 0
            ? input.proposals.filter(
                (proposal) => !acceptedProposalIds.has(proposal.id),
              )
            : input.proposals;
        const availabilityOptions = mergeAcceptedOutreachIntoOptions(
          this.teacherAvailabilityExpansionService.analyze({
            requirement,
            snapshot,
            settings,
            proposals: outreachProposals,
            operatingPhase: operatingPhase ?? null,
            teacherById,
            classroomById,
            courses,
          }),
          acceptedRecords,
        );

        return [
          requirement.id,
          SchedulingRecoveryAnalysisSchema.parse({
            options: recovery.options.slice(0, 6),
            totalOptionCount: recovery.options.length,
            qualifiedTeacherCount,
            compatibleClassroomCount,
            busyTeachers:
              recovery.options.length === 0
                ? Array.from(recovery.busyTeacherIds)
                    .map((teacherId) => teacherById.get(teacherId))
                    .filter(
                      (teacher): teacher is NonNullable<typeof teacher> =>
                        teacher !== undefined,
                    )
                : [],
            teacherCalendars: this.teacherCalendarService.build({
              courseId: requirement.courseId,
              additionalTeacherIds: chainTeacherIds,
              qualifications: appendOutreachAvailabilitiesToQualifications(
                snapshot.teachers,
                acceptedRecords,
              ),
              teachers,
              proposals: input.proposals,
              existingClasses: snapshot.existingClasses,
              existingClassTitles,
            }),
            reassignmentChains,
            staffingFallback: {
              addTeacherSuggested: true,
              availabilityOptions,
            },
          }),
        ];
      }),
    );
  }
}
