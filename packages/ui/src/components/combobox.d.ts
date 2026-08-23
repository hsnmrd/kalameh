import * as React from "react"
export interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}
export interface ComboboxProps {
  items: ComboboxOption[]
  value?: string | null
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  searchable?: boolean
  clearable?: boolean
  className?: string
  "data-invalid"?: boolean
}
export declare function Combobox({
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  emptyMessage,
  disabled,
  searchable,
  clearable,
  className,
  "data-invalid": dataInvalid,
}: ComboboxProps): React.JSX.Element
//# sourceMappingURL=combobox.d.ts.map
