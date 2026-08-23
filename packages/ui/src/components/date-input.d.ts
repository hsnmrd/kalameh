import * as React from "react"
export type DateInputLocale = "fa" | "en"
export interface DateInputProps {
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | undefined) => void
  locale?: DateInputLocale
  calendarType?: "jalali" | "gregorian"
  disabled?: boolean
  clearable?: boolean
  className?: string
  "data-invalid"?: boolean
  placeholderYear?: string
  placeholderMonth?: string
  placeholderDay?: string
}
export declare function DateInput({
  value,
  defaultValue,
  onChange,
  locale,
  calendarType,
  disabled,
  clearable,
  className,
  "data-invalid": dataInvalid,
  placeholderYear,
  placeholderMonth,
  placeholderDay,
}: DateInputProps): React.JSX.Element
//# sourceMappingURL=date-input.d.ts.map
