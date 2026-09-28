import {
  DEFAULT_SCHEDULING_SETTINGS,
  SchedulingEngineSettingsSnapshotSchema,
} from '@workspace/types';
import { SchedulingNewTeacherScheduleOptimizerService } from './scheduling-new-teacher-schedule-optimizer.service';
import { SchedulingNewTeacherArrangementService } from './scheduling-new-teacher-arrangement.service';
import { SchedulingNewTeacherPreferenceService } from './scheduling-new-teacher-preference.service';
import { SchedulingScheduleWindowService } from './scheduling-schedule-window.service';

describe('SchedulingNewTeacherScheduleOptimizerService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const windowService = new SchedulingScheduleWindowService();
  const service = new SchedulingNewTeacherScheduleOptimizerService(
    windowService,
    new SchedulingNewTeacherPreferenceService(windowService),
    new SchedulingNewTeacherArrangementService(windowService),
  );
  const settings = SchedulingEngineSettingsSnapshotSchema.parse({
    schemaVersion: '1',
    ...DEFAULT_SCHEDULING_SETTINGS,
  });

  it('packs every missing class into consecutive slots on one three-day pattern', () => {
    const plan = service.optimize({
      workItems: [
        {
          key: 'ame-3:1',
          requirementId: uuid(1),
          course: { id: uuid(11), title: 'AME 3' },
          classNumber: 1,
          branchId: null,
          capacity: 12,
          durationMinutes: 90,
          deliveryMode: 'IN_PERSON',
        },
        {
          key: 'ame-4:1',
          requirementId: uuid(2),
          course: { id: uuid(12), title: 'AME 4' },
          classNumber: 1,
          branchId: null,
          capacity: 12,
          durationMinutes: 90,
          deliveryMode: 'IN_PERSON',
        },
        {
          key: 'ame-5:1',
          requirementId: uuid(3),
          course: { id: uuid(13), title: 'AME 5' },
          classNumber: 1,
          branchId: null,
          capacity: 12,
          durationMinutes: 90,
          deliveryMode: 'IN_PERSON',
        },
      ],
      settings,
      operatingPhase: {
        startTime: '09:00',
        endTime: '15:00',
        slotDurationMinutes: 90,
        daysOfWeek: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
        hasBreak: false,
        breakStartTime: null,
        breakEndTime: null,
      },
      classrooms: [
        {
          id: uuid(20),
          name: 'Room 1',
          capacity: 20,
          branchId: null,
          isActive: true,
        },
      ],
      scheduledClasses: [
        {
          classroomId: uuid(20),
          daysOfWeek: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
          sessionDates: [],
          startTime: '09:00',
          endTime: '10:30',
        },
      ],
    });

    expect(plan).toMatchObject({
      daysOfWeek: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
      startTime: '10:30',
      endTime: '15:00',
      totalClassCount: 3,
      coversAllUnresolvedClasses: true,
      usesPreferredThreeDayPattern: true,
      hasConsecutiveTimes: true,
      assignments: [
        { startTime: '10:30', endTime: '12:00' },
        { startTime: '12:00', endTime: '13:30' },
        { startTime: '13:30', endTime: '15:00' },
      ],
    });
    expect(
      plan?.assignments.every(({ classroom }) => classroom?.id === uuid(20)),
    ).toBe(true);
  });

  it('keeps the best plan when a break prevents consecutive times', () => {
    const plan = service.optimize({
      workItems: [
        {
          key: 'ame-5:1',
          requirementId: uuid(3),
          course: { id: uuid(13), title: 'AME 5' },
          classNumber: 1,
          branchId: null,
          capacity: 12,
          durationMinutes: 90,
          deliveryMode: 'ONLINE',
        },
        {
          key: 'ame-5:2',
          requirementId: uuid(3),
          course: { id: uuid(13), title: 'AME 5' },
          classNumber: 2,
          branchId: null,
          capacity: 12,
          durationMinutes: 90,
          deliveryMode: 'ONLINE',
        },
      ],
      settings,
      operatingPhase: {
        startTime: '09:00',
        endTime: '12:15',
        slotDurationMinutes: 90,
        daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
        hasBreak: true,
        breakStartTime: '10:30',
        breakEndTime: '10:45',
      },
      classrooms: [],
      scheduledClasses: [],
    });

    expect(plan).toMatchObject({
      daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
      startTime: '09:00',
      endTime: '12:15',
      usesPreferredThreeDayPattern: true,
      hasConsecutiveTimes: false,
      assignments: [
        { startTime: '09:00', endTime: '10:30' },
        { startTime: '10:45', endTime: '12:15' },
      ],
    });
  });

  it('uses only operating-phase slots for missing-class suggestions', () => {
    const roomId = uuid(21);
    const plan = service.optimize({
      workItems: [
        {
          key: 'ame-4:1',
          requirementId: uuid(7),
          course: { id: uuid(17), title: 'AME 4' },
          classNumber: 1,
          branchId: null,
          capacity: 12,
          durationMinutes: 90,
          deliveryMode: 'IN_PERSON',
        },
      ],
      settings,
      operatingPhase: {
        startTime: '14:00',
        endTime: '18:30',
        slotDurationMinutes: 90,
        daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
        hasBreak: false,
        breakStartTime: null,
        breakEndTime: null,
      },
      classrooms: [
        {
          id: roomId,
          name: 'Room 1',
          capacity: 20,
          branchId: null,
          isActive: true,
        },
      ],
      scheduledClasses: [
        {
          classroomId: roomId,
          daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
          sessionDates: [],
          startTime: '14:00',
          endTime: '15:00',
        },
      ],
    });

    expect(plan?.assignments).toHaveLength(1);
    expect(plan?.assignments[0]).toMatchObject({
      startTime: '15:30',
      endTime: '17:00',
      classroom: { id: roomId },
    });
    expect(
      plan?.availableTimeSlots.map(
        ({ startTime, endTime }) => `${startTime}-${endTime}`,
      ),
    ).toEqual(['14:00-15:30', '15:30-17:00', '17:00-18:30']);
  });

  it('keeps a consolidated hiring schedule when a room still needs to be arranged', () => {
    const plan = service.optimize({
      workItems: [
        {
          key: 'ame-5:4',
          requirementId: uuid(4),
          course: { id: uuid(13), title: 'AME 5' },
          classNumber: 4,
          branchId: null,
          capacity: 12,
          durationMinutes: 90,
          deliveryMode: 'IN_PERSON',
        },
      ],
      settings,
      operatingPhase: {
        startTime: '09:00',
        endTime: '12:00',
        slotDurationMinutes: 90,
        daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
        hasBreak: false,
        breakStartTime: null,
        breakEndTime: null,
      },
      classrooms: [],
      scheduledClasses: [],
    });

    expect(plan).toMatchObject({
      daysOfWeek: ['SUNDAY', 'TUESDAY', 'THURSDAY'],
      totalClassCount: 1,
      usesPreferredThreeDayPattern: true,
      assignments: [
        {
          key: 'ame-5:4',
          startTime: '09:00',
          endTime: '10:30',
          classroom: null,
        },
      ],
    });
  });

  it('uses an alternative day pattern when odd and even groups are unavailable', () => {
    const plan = service.optimize({
      workItems: [
        {
          key: 'ame-5:5',
          requirementId: uuid(5),
          course: { id: uuid(13), title: 'AME 5' },
          classNumber: 5,
          branchId: null,
          capacity: 12,
          durationMinutes: 90,
          deliveryMode: 'ONLINE',
        },
      ],
      settings,
      operatingPhase: {
        startTime: '09:00',
        endTime: '12:00',
        slotDurationMinutes: 90,
        daysOfWeek: ['FRIDAY'],
        hasBreak: false,
        breakStartTime: null,
        breakEndTime: null,
      },
      classrooms: [],
      scheduledClasses: [],
    });

    expect(plan).toMatchObject({
      daysOfWeek: ['FRIDAY'],
      usesPreferredThreeDayPattern: false,
      hasConsecutiveTimes: true,
    });
  });

  it('distributes classes across configured groups when one three-day pattern cannot fit them all', () => {
    const workItems = [1, 2, 3].map((classNumber) => ({
      key: `ame-5:${classNumber}`,
      requirementId: uuid(6),
      course: { id: uuid(13), title: 'AME 5' },
      classNumber,
      branchId: null,
      capacity: 12,
      durationMinutes: 90,
      deliveryMode: 'ONLINE' as const,
    }));
    const plan = service.optimize({
      workItems,
      settings,
      operatingPhase: {
        startTime: '09:00',
        endTime: '12:00',
        slotDurationMinutes: 90,
        daysOfWeek: [
          'SATURDAY',
          'SUNDAY',
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
        ],
        hasBreak: false,
        breakStartTime: null,
        breakEndTime: null,
      },
      classrooms: [],
      scheduledClasses: [],
    });

    expect(plan).toMatchObject({
      totalClassCount: 3,
      usesPreferredThreeDayPattern: false,
      hasConsecutiveTimes: true,
    });
    expect(plan?.daysOfWeek).toHaveLength(6);
    expect(
      new Set(plan?.assignments.map(({ daysOfWeek }) => daysOfWeek.join('-')))
        .size,
    ).toBe(2);
  });
});
