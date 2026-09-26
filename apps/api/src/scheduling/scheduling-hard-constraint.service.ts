import { Injectable } from '@nestjs/common';
import {
  DEFAULT_SCHEDULING_SETTINGS,
  SchedulingHardConstraintEvaluationSchema,
  type ClassDeliveryMode,
  type SchedulingCandidateRejection,
  type SchedulingCandidateSlot,
  type SchedulingFeasibleCandidate,
  type SchedulingHardConstraintCode,
  type SchedulingHardConstraintEvaluation,
  type WeekDay,
} from '@workspace/types';

type HardConstraintRequirement = {
  id: string;
  courseId: string;
  branchId: string | null;
  capacity: number;
  sessionDurationMinutes: number;
  deliveryMode: ClassDeliveryMode;
};

type HardConstraintQualification = {
  id: string;
  courseId: string;
  teacherProfile: {
    userId: string;
    user: {
      isActive: boolean;
      role: string;
      branchId: string | null;
    };
    availabilities: Array<{
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
  };
};

type HardConstraintClassroom = {
  id: string;
  branchId: string | null;
  capacity: number;
  isActive: boolean;
};

type ExistingScheduledClass = {
  id: string;
  teacherId: string | null;
  classroomId: string | null;
  daysOfWeek: string[];
  sessionDates: string[];
  startTime: string | null;
  endTime: string | null;
};

export type EvaluateHardConstraintsInput = {
  candidates: SchedulingCandidateSlot[];
  requirements: HardConstraintRequirement[];
  qualifications: HardConstraintQualification[];
  classrooms: HardConstraintClassroom[];
  existingClasses: ExistingScheduledClass[];
};

@Injectable()
export class SchedulingHardConstraintService {
  evaluate(
    input: EvaluateHardConstraintsInput,
  ): SchedulingHardConstraintEvaluation {
    const requirements = new Map(
      input.requirements.map((requirement) => [requirement.id, requirement]),
    );
    const qualifications = new Map(
      input.qualifications.map((qualification) => [
        qualification.id,
        qualification,
      ]),
    );
    const accepted: SchedulingFeasibleCandidate[] = [];
    const rejected: SchedulingCandidateRejection[] = [];

    const candidateByKey = new Map<string, SchedulingCandidateSlot>();
    for (const candidate of [...input.candidates].sort(
      (left, right) =>
        left.key.localeCompare(right.key) ||
        left.availabilityId.localeCompare(right.availabilityId),
    )) {
      if (!candidateByKey.has(candidate.key)) {
        candidateByKey.set(candidate.key, candidate);
      }
    }
    const candidates = Array.from(candidateByKey.values());

    for (const candidate of candidates) {
      const requirement = requirements.get(candidate.requirementId);
      if (
        !requirement ||
        requirement.courseId !== candidate.courseId ||
        requirement.branchId !== candidate.branchId ||
        requirement.sessionDurationMinutes !== candidate.durationMinutes
      ) {
        rejected.push(this.reject(candidate, ['INCOMPLETE_CLASS_REQUIREMENT']));
        continue;
      }

      const qualification = qualifications.get(candidate.qualificationId);
      if (
        !qualification ||
        qualification.courseId !== candidate.courseId ||
        qualification.teacherProfile.userId !== candidate.teacherId
      ) {
        rejected.push(this.reject(candidate, ['TEACHER_NOT_QUALIFIED']));
        continue;
      }

      const teacher = qualification.teacherProfile.user;
      if (
        !teacher.isActive ||
        teacher.role !== 'TEACHER' ||
        (requirement.branchId !== null &&
          teacher.branchId !== null &&
          teacher.branchId !== requirement.branchId)
      ) {
        rejected.push(this.reject(candidate, ['INVALID_TEACHER']));
        continue;
      }

      const availability = qualification.teacherProfile.availabilities.find(
        (item) =>
          item.id === candidate.availabilityId &&
          item.dayOfWeek === candidate.dayOfWeek &&
          item.startTime <= candidate.startTime &&
          item.endTime >= candidate.endTime,
      );
      if (!availability) {
        rejected.push(this.reject(candidate, ['OUTSIDE_TEACHER_AVAILABILITY']));
        continue;
      }

      if (
        input.existingClasses.some(
          (existingClass) =>
            existingClass.teacherId === candidate.teacherId &&
            this.hasScheduleConflict(candidate, existingClass),
        )
      ) {
        rejected.push(this.reject(candidate, ['TEACHER_TIME_CONFLICT']));
        continue;
      }

      if (requirement.deliveryMode === 'ONLINE') {
        accepted.push(
          this.accept(
            candidate,
            requirement.deliveryMode,
            requirement.capacity,
          ),
        );
        continue;
      }

      const locationCompatibleRooms = input.classrooms.filter(
        (classroom) =>
          classroom.isActive &&
          (requirement.branchId === null ||
            classroom.branchId === null ||
            classroom.branchId === requirement.branchId),
      );
      if (locationCompatibleRooms.length === 0) {
        rejected.push(this.reject(candidate, ['INVALID_DELIVERY_LOCATION']));
        continue;
      }

      const capacityCompatibleRooms = locationCompatibleRooms.filter(
        (classroom) => classroom.capacity >= requirement.capacity,
      );
      if (capacityCompatibleRooms.length === 0) {
        rejected.push(
          this.reject(candidate, ['INSUFFICIENT_CLASSROOM_CAPACITY']),
        );
        continue;
      }

      const feasibleRooms = capacityCompatibleRooms.filter(
        (classroom) =>
          !input.existingClasses.some(
            (existingClass) =>
              existingClass.classroomId === classroom.id &&
              this.hasScheduleConflict(candidate, existingClass),
          ),
      );
      if (feasibleRooms.length === 0) {
        rejected.push(this.reject(candidate, ['CLASSROOM_TIME_CONFLICT']));
        continue;
      }

      for (const classroom of feasibleRooms.sort((left, right) =>
        left.id.localeCompare(right.id),
      )) {
        accepted.push(
          this.accept(
            candidate,
            requirement.deliveryMode,
            classroom.capacity,
            classroom.id,
          ),
        );
      }
    }

    return SchedulingHardConstraintEvaluationSchema.parse({
      accepted,
      rejected,
      summary: {
        inputCandidateCount: candidates.length,
        feasibleAssignmentCount: accepted.length,
        rejectedCandidateCount: rejected.length,
      },
    });
  }

  private accept(
    candidate: SchedulingCandidateSlot,
    deliveryMode: ClassDeliveryMode,
    capacity: number,
    classroomId: string | null = null,
  ): SchedulingFeasibleCandidate {
    return {
      ...candidate,
      assignmentKey: `${candidate.key}:${classroomId ?? 'ONLINE'}`,
      classroomId,
      deliveryMode,
      capacity,
    };
  }

  private reject(
    candidate: SchedulingCandidateSlot,
    reasonCodes: SchedulingHardConstraintCode[],
  ): SchedulingCandidateRejection {
    return { candidate, reasonCodes, context: {} };
  }

  private candidateDays(candidate: SchedulingCandidateSlot): readonly string[] {
    if (candidate.timeGroup.startsWith('EVEN')) {
      return DEFAULT_SCHEDULING_SETTINGS.timeGroups.evenDays;
    }
    if (candidate.timeGroup.startsWith('ODD')) {
      return DEFAULT_SCHEDULING_SETTINGS.timeGroups.oddDays;
    }
    if (candidate.timeGroup.startsWith('NEUTRAL')) {
      return DEFAULT_SCHEDULING_SETTINGS.timeGroups.neutralDays;
    }
    return [candidate.dayOfWeek];
  }

  private hasScheduleConflict(
    candidate: SchedulingCandidateSlot,
    existingClass: ExistingScheduledClass,
  ): boolean {
    if (!existingClass.startTime || !existingClass.endTime) return false;
    if (!(
      candidate.startTime < existingClass.endTime &&
      existingClass.startTime < candidate.endTime
    )) {
      return false;
    }

    const candidateDays = this.candidateDays(candidate);
    return candidateDays.some((day) =>
      this.classOccursOnDay(existingClass, day as WeekDay),
    );
  }

  private classOccursOnDay(
    existingClass: ExistingScheduledClass,
    dayOfWeek: WeekDay,
  ): boolean {
    if (existingClass.daysOfWeek.includes(dayOfWeek)) return true;

    return existingClass.sessionDates.some(
      (sessionDate) => this.dayOfWeek(sessionDate) === dayOfWeek,
    );
  }

  private dayOfWeek(sessionDate: string): WeekDay | null {
    const datePart = sessionDate.slice(0, 10);
    const date = new Date(`${datePart}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;

    return [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][date.getUTCDay()] as WeekDay;
  }
}
