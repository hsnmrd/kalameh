import { z } from "zod"
import { WEEK_DAYS } from "../class/class.schema.js"
import { SCHEDULING_TIME_REGEX } from "./scheduling.constants.js"

function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export const SchedulingTimeGroupSettingsSchema = z
  .object({
    oddDays: z.array(z.enum(WEEK_DAYS)),
    evenDays: z.array(z.enum(WEEK_DAYS)),
    neutralDays: z.array(z.enum(WEEK_DAYS)),
    eveningStartsAt: z.string().regex(SCHEDULING_TIME_REGEX),
    timeZone: z.string().trim().min(1),
  })
  .superRefine((settings, context) => {
    const configuredDays = [
      ...settings.oddDays,
      ...settings.evenDays,
      ...settings.neutralDays,
    ]
    const uniqueDays = new Set(configuredDays)

    if (
      configuredDays.length !== WEEK_DAYS.length ||
      uniqueDays.size !== WEEK_DAYS.length ||
      WEEK_DAYS.some((day) => !uniqueDays.has(day)) ||
      settings.oddDays.length === 0 ||
      settings.evenDays.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["oddDays"],
      })
    }

    if (
      settings.eveningStartsAt < "10:00" ||
      settings.eveningStartsAt > "18:00"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eveningStartsAt"],
      })
    }

    if (!isValidIanaTimeZone(settings.timeZone)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeZone"],
      })
    }
  })

export type SchedulingTimeGroupSettings = z.infer<
  typeof SchedulingTimeGroupSettingsSchema
>
