import type {
  ClassDeliveryMode,
  SchedulingEngineSettingsSnapshot,
  SchedulingNewTeacherHiringAssignment,
} from '@workspace/types';
import type {
  SchedulingWindowClass,
  SchedulingWindowOperatingPhase,
} from './scheduling-schedule-window.service';

export type NewTeacherHiringWorkItem = {
  key: string;
  requirementId: string;
  course: { id: string; title: string };
  classNumber: number;
  branchId: string | null;
  capacity: number;
  durationMinutes: number;
  deliveryMode: ClassDeliveryMode;
};

export type NewTeacherHiringClassroom = {
  id: string;
  name: string;
  capacity: number;
  branchId: string | null;
  isActive: boolean;
};

export type OptimizeHiringPlanInput = {
  workItems: NewTeacherHiringWorkItem[];
  settings: SchedulingEngineSettingsSnapshot;
  operatingPhase: SchedulingWindowOperatingPhase & {
    slotDurationMinutes: number;
  };
  classrooms: NewTeacherHiringClassroom[];
  scheduledClasses: SchedulingWindowClass[];
};

export type NewTeacherArrangement = {
  assignments: SchedulingNewTeacherHiringAssignment[];
  roomChangeCount: number;
  roomIssueCount: number;
  gapMinutes: number;
};
