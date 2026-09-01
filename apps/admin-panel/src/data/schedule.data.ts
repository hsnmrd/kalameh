import type { WeekDay } from "@workspace/types"

export const DAY_TO_JS_DAY: Record<WeekDay, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}

export interface SchedulePreset {
  id: "EVEN" | "ODD" | "WEEKEND"
  titleKey: string
  days: WeekDay[]
}

export const PRESETS: SchedulePreset[] = [
  {
    id: "EVEN",
    titleKey: "presetEven",
    days: ["SATURDAY", "MONDAY", "WEDNESDAY"],
  },
  {
    id: "ODD",
    titleKey: "presetOdd",
    days: ["SUNDAY", "TUESDAY"],
  },
  {
    id: "WEEKEND",
    titleKey: "presetWeekend",
    days: ["THURSDAY", "FRIDAY"],
  },
]

export const SCHEDULE_PRESETS = PRESETS
