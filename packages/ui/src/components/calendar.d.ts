import * as React from "react"
import { type DayPickerProps } from "react-day-picker"
export type CalendarLocale = "fa" | "en"
type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never
export type CalendarProps = DistributiveOmit<DayPickerProps, "locale"> & {
  locale?: CalendarLocale
  calendarType?: "jalali" | "gregorian"
}
export declare function Calendar({
  className,
  classNames,
  showOutsideDays,
  locale,
  calendarType,
  dir,
  ...props
}: CalendarProps): React.JSX.Element
export {}
//# sourceMappingURL=calendar.d.ts.map
