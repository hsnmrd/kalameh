"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as React from "react"
import { format as formatGregorian, parseISO, isValid } from "date-fns"
import { format as formatJalali } from "date-fns-jalali"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverTrigger,
  PopoverPopup,
} from "@workspace/ui/components/popover"
import { Calendar } from "@workspace/ui/components/calendar"
export function DatePicker({
  value,
  defaultValue,
  onChange,
  locale = "fa",
  calendarType,
  placeholder = "انتخاب تاریخ...",
  disabled = false,
  clearable = true,
  className,
  "data-invalid": dataInvalid,
  minDate,
  maxDate,
}) {
  const [open, setOpen] = React.useState(false)
  const isJalali = calendarType ? calendarType === "jalali" : locale === "fa"
  // Parse current value to Date object
  const selectedDate = React.useMemo(() => {
    const raw = value !== undefined ? value : defaultValue
    if (!raw) return undefined
    if (raw instanceof Date) return isValid(raw) ? raw : undefined
    const parsed = parseISO(raw)
    return isValid(parsed) ? parsed : undefined
  }, [value, defaultValue])
  // Format date display based on calendar system
  const formattedDisplay = React.useMemo(() => {
    if (!selectedDate) return null
    try {
      if (isJalali) {
        return formatJalali(selectedDate, "yyyy/MM/dd")
      }
      return formatGregorian(selectedDate, "yyyy-MM-dd")
    } catch {
      return null
    }
  }, [selectedDate, isJalali])
  const handleSelect = (date) => {
    if (!date) {
      onChange?.(undefined)
      return
    }
    // Convert to ISO Date string (YYYY-MM-DD)
    const isoString = formatGregorian(date, "yyyy-MM-dd")
    onChange?.(isoString)
    setOpen(false)
  }
  const handleClear = (e) => {
    e.stopPropagation()
    onChange?.(undefined)
  }
  return _jsxs(Popover, {
    open: open,
    onOpenChange: setOpen,
    children: [
      _jsxs("div", {
        className: cn(
          "relative flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-2xs transition-colors focus-within:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          dataInvalid && "border-destructive focus-within:border-destructive",
          className
        ),
        children: [
          _jsxs(PopoverTrigger, {
            disabled: disabled,
            className:
              "flex h-full w-full cursor-pointer items-center gap-2 text-start text-sm outline-hidden select-none",
            children: [
              _jsx(CalendarIcon, {
                className: "size-4 shrink-0 text-muted-foreground",
              }),
              _jsx("span", {
                className: cn(
                  "flex-1 font-mono text-sm",
                  !formattedDisplay && "font-sans text-muted-foreground"
                ),
                children: formattedDisplay || placeholder,
              }),
            ],
          }),
          clearable &&
            selectedDate &&
            !disabled &&
            _jsx(Button, {
              type: "button",
              variant: "ghost",
              size: "icon",
              onClick: handleClear,
              className:
                "size-6 rounded-md p-0 text-muted-foreground hover:text-foreground",
              "aria-label": "Clear date",
              children: _jsx(X, { className: "size-3.5" }),
            }),
        ],
      }),
      _jsx(PopoverPopup, {
        className: "w-auto border-0 bg-transparent p-0 shadow-none",
        children: _jsx(Calendar, {
          mode: "single",
          selected: selectedDate,
          onSelect: handleSelect,
          locale: locale,
          calendarType: calendarType,
          disabled:
            minDate || maxDate
              ? (date) => {
                  if (minDate && date < minDate) return true
                  if (maxDate && date > maxDate) return true
                  return false
                }
              : undefined,
          autoFocus: true,
        }),
      }),
    ],
  })
}
