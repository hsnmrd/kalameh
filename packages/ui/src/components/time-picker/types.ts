import * as React from "react"

export interface WheelItem<T = string | number> {
  value: T
  label: React.ReactNode
  disabled?: boolean
}

export interface WheelColumnProps<T = string | number> {
  items: WheelItem<T>[]
  value: T
  onChange: (value: T) => void
  itemHeight?: number
  visibleCount?: number
  className?: string
  ariaLabel?: string
}

export interface WheelPickerProps {
  children: React.ReactNode
  className?: string
  highlightClassName?: string
  itemHeight?: number
  visibleCount?: number
}

export interface TimeWheelPickerProps {
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string) => void
  locale?: "fa" | "en"
  minuteStep?: number
  minTime?: string
  maxTime?: string
  showLabels?: boolean
  className?: string
  itemHeight?: number
  visibleCount?: number
}

export interface TimePickerProps {
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string | undefined) => void
  locale?: "fa" | "en"
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
  "data-invalid"?: boolean
  minTime?: string
  maxTime?: string
  minuteStep?: number
  showLabels?: boolean
  drawerTitle?: string
  confirmLabel?: string
  clearLabel?: string
  nowLabel?: string
  variant?: "default" | "inline"
  id?: string
  name?: string
  itemHeight?: number
  visibleCount?: number
}
