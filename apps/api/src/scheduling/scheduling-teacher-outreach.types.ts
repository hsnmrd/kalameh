import { Prisma } from '@workspace/database';
import {
  calculateTermScheduleFromDateRange,
  type ClassDeliveryMode,
  type SchedulingTeacherOutreachOption,
  type ToggleTeacherOutreachInput,
  type WeekDay,
} from '@workspace/types';

export type AcceptedTeacherOutreachRecord = {
  optionKey: string;
  proposalId: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  deliveryMode: ClassDeliveryMode;
  daysOfWeek: WeekDay[];
  startTime: string;
  endTime: string;
  availabilityChangeDays: WeekDay[];
  availableClassrooms: Array<{
    id: string;
    name: string;
    capacity: number;
  }>;
  createdAvailabilityIds: string[];
};

export function readAcceptedOutreachRecords(
  details: unknown,
): AcceptedTeacherOutreachRecord[] {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return [];
  }
  const raw = (details as Record<string, unknown>).acceptedOutreachOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is AcceptedTeacherOutreachRecord =>
    Boolean(
      item &&
      typeof item === 'object' &&
      typeof (item as AcceptedTeacherOutreachRecord).optionKey === 'string' &&
      typeof (item as AcceptedTeacherOutreachRecord).proposalId === 'string',
    ),
  );
}

export function mergeAcceptedOutreachIntoOptions(
  computedOptions: SchedulingTeacherOutreachOption[],
  acceptedRecords: AcceptedTeacherOutreachRecord[],
): SchedulingTeacherOutreachOption[] {
  const acceptedByKey = new Map(
    acceptedRecords.map((rec) => [rec.optionKey, rec]),
  );
  const mappedComputed = computedOptions.slice(0, 3).map((option) => {
    const accepted = acceptedByKey.get(option.key);
    return accepted
      ? {
          ...option,
          isAccepted: true,
          acceptedProposalId: accepted.proposalId,
        }
      : {
          ...option,
          isAccepted: false,
          acceptedProposalId: null,
        };
  });

  const missingAccepted = acceptedRecords
    .filter((rec) => !mappedComputed.some((opt) => opt.key === rec.optionKey))
    .map((rec) => ({
      key: rec.optionKey,
      teacher: rec.teacher,
      deliveryMode: rec.deliveryMode,
      daysOfWeek: rec.daysOfWeek,
      startTime: rec.startTime,
      endTime: rec.endTime,
      availabilityChangeDays: rec.availabilityChangeDays,
      availableClassrooms: rec.availableClassrooms,
      isAccepted: true,
      acceptedProposalId: rec.proposalId,
    }));

  return [...missingAccepted, ...mappedComputed];
}

export function appendOutreachAvailabilitiesToQualifications<
  T extends {
    teacherProfile: {
      userId: string;
      availabilities: Array<{
        id: string;
        dayOfWeek: WeekDay;
        startTime: string;
        endTime: string;
      }>;
    };
  },
>(qualifications: T[], acceptedRecords: AcceptedTeacherOutreachRecord[]): T[] {
  if (acceptedRecords.length === 0) return qualifications;
  return qualifications.map((qual) => {
    const teacherAccepted = acceptedRecords.filter(
      (rec) => rec.teacher.id === qual.teacherProfile.userId,
    );
    if (teacherAccepted.length === 0) return qual;
    const extraAvailabilities = teacherAccepted.flatMap((rec) =>
      rec.daysOfWeek.map((dayOfWeek, idx) => ({
        id: `${rec.proposalId}:${idx}`,
        dayOfWeek,
        startTime: rec.startTime,
        endTime: rec.endTime,
      })),
    );
    return {
      ...qual,
      teacherProfile: {
        ...qual.teacherProfile,
        availabilities: [
          ...qual.teacherProfile.availabilities,
          ...extraAvailabilities,
        ],
      },
    };
  });
}

export async function removeAcceptedOutreachInTransaction(
  tx: Prisma.TransactionClient,
  instituteId: string,
  planId: string,
  record: AcceptedTeacherOutreachRecord,
): Promise<void> {
  await tx.schedulingProposal.deleteMany({
    where: {
      id: record.proposalId,
      planId,
      instituteId,
      publishedClassId: null,
    },
  });
  if (record.createdAvailabilityIds.length > 0) {
    await tx.teacherAvailability.deleteMany({
      where: {
        id: { in: record.createdAvailabilityIds },
        teacherProfile: { user: { instituteId } },
      },
    });
  }
}

export async function createProposalSessionsForTerm(
  tx: Prisma.TransactionClient,
  params: {
    instituteId: string;
    planId: string;
    proposalId: string;
    startDate: Date | null | undefined;
    endDate: Date | null | undefined;
    daysOfWeek: WeekDay[];
    startTime: string;
    endTime: string;
  },
): Promise<void> {
  if (!params.startDate || !params.endDate) return;
  const schedule = calculateTermScheduleFromDateRange({
    startDate: params.startDate,
    endDate: params.endDate,
    daysOfWeek: params.daysOfWeek,
    skipHolidays: true,
    observeOfficialHolidays: true,
  });
  if (schedule.sessionDates.length === 0) return;
  await tx.schedulingProposalSession.createMany({
    data: schedule.sessionDates.map((dateStr) => ({
      instituteId: params.instituteId,
      planId: params.planId,
      proposalId: params.proposalId,
      sessionDate: new Date(dateStr),
      startTime: params.startTime,
      endTime: params.endTime,
    })),
    skipDuplicates: true,
  });
}

export function buildUpdatedUnresolvedDetails(
  currentDetails: unknown,
  acceptedOutreachOptions: AcceptedTeacherOutreachRecord[],
): Prisma.InputJsonValue {
  const base =
    currentDetails &&
    typeof currentDetails === 'object' &&
    !Array.isArray(currentDetails)
      ? (currentDetails as Record<string, unknown>)
      : {};
  return JSON.parse(
    JSON.stringify({
      ...base,
      acceptedOutreachOptions,
    }),
  ) as Prisma.InputJsonValue;
}

export function buildOutreachSelectionReasons(
  input: ToggleTeacherOutreachInput,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify([
      {
        code: 'MANUALLY_SELECTED',
        evidence: {
          source: 'TEACHER_OUTREACH_ACCEPTED',
          optionKey: input.optionKey,
        },
      },
    ]),
  ) as Prisma.InputJsonValue;
}
