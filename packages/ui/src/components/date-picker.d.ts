import * as React from "react"
import { type CalendarLocale } from "@workspace/ui/components/calendar"
export interface DatePickerProps {
  value?: string | Date | null
  defaultValue?: string | Date | null
  onChange?: (value: string | undefined) => void
  locale?: CalendarLocale
  calendarType?: "jalali" | "gregorian"
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
  "data-invalid"?: boolean
  minDate?: Date
  maxDate?: Date
}
export declare function DatePicker({
  value,
  defaultValue,
  onChange,
  locale,
  calendarType,
  placeholder,
  disabled,
  clearable,
  className,
  "data-invalid": dataInvalid,
  minDate,
  maxDate,
}: DatePickerProps): React.JSX.Element
//# sourceMappingURL=date-picker.d.ts.map
