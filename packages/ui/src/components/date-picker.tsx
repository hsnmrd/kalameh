"use client"

import * as React from "react"
import { format as formatGregorian, parseISO, isValid } from "date-fns"
import { format as formatJalali } from "date-fns-jalali"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { ResponsivePopover } from "@workspace/ui/components/popover"
import {
  Calendar,
  type CalendarLocale,
} from "@workspace/ui/components/calendar"

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
  drawerTitle?: string
  showOffDays?: boolean
  observeOfficialHolidays?: boolean
  isOffDay?: (date: Date) => boolean
  offDays?: (Date | string)[]
  variant?: "default" | "inline"
}

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
  drawerTitle,
  showOffDays = false,
  observeOfficialHolidays = true,
  isOffDay,
  offDays,
  variant = "default",
}: DatePickerProps) {
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

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(undefined)
      return
    }
    // Convert to ISO Date string (YYYY-MM-DD)
    const isoString = formatGregorian(date, "yyyy-MM-dd")
    onChange?.(isoString)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
  }

  if (variant === "inline") {
    return (
      <ResponsivePopover
        open={open}
        onOpenChange={setOpen}
        drawerTitle={
          drawerTitle ?? (locale === "fa" ? "انتخاب تاریخ" : "Select date")
        }
        onClear={
          clearable && selectedDate
            ? () => {
                onChange?.(undefined)
                setOpen(false)
              }
            : undefined
        }
        clearLabel={locale === "fa" ? "پاک کردن" : "Clear"}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
        drawerBodyClassName="flex justify-center px-4"
        trigger={
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className={cn(
              "group inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-foreground transition-colors select-none hover:bg-muted hover:text-primary disabled:cursor-not-allowed",
              dataInvalid && "text-destructive",
              className
            )}
          >
            <span
              className={cn(
                locale === "fa" ? "font-sans" : "font-mono",
                !formattedDisplay && "text-muted-foreground/35"
              )}
            >
              {formattedDisplay || placeholder}
            </span>
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
          </Button>
        }
      >
        <Calendar
          key={
            open
              ? selectedDate
                ? selectedDate.toISOString()
                : "open"
              : "closed"
          }
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate || minDate || new Date()}
          onSelect={handleSelect}
          locale={locale}
          calendarType={calendarType}
          showOffDays={showOffDays}
          observeOfficialHolidays={observeOfficialHolidays}
          isOffDay={isOffDay}
          offDays={offDays}
          disabled={
            minDate || maxDate
              ? (date: Date) => {
                  if (minDate && date < minDate) return true
                  if (maxDate && date > maxDate) return true
                  return false
                }
              : undefined
          }
          autoFocus
        />
      </ResponsivePopover>
    )
  }

  return (
    <div
      className={cn(
        "relative flex h-14 w-full items-center justify-between rounded-2xl border border-border bg-background px-4 text-base text-foreground shadow-2xs transition-colors focus-within:border-2 focus-within:border-ring focus-within:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        dataInvalid && "border-destructive focus-within:border-destructive",
        className
      )}
    >
      <ResponsivePopover
        open={open}
        onOpenChange={setOpen}
        drawerTitle={
          drawerTitle ?? (locale === "fa" ? "انتخاب تاریخ" : "Select date")
        }
        onClear={
          clearable && selectedDate
            ? () => {
                onChange?.(undefined)
                setOpen(false)
              }
            : undefined
        }
        clearLabel={locale === "fa" ? "پاک کردن" : "Clear"}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
        drawerBodyClassName="flex justify-center px-4"
        trigger={
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className="flex h-full min-w-0 flex-1 cursor-pointer items-center justify-start gap-2.5 p-0 text-start text-base font-normal outline-hidden select-none hover:bg-transparent disabled:cursor-not-allowed"
          >
            <CalendarIcon className="size-5 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "flex-1 text-base",
                locale === "fa" ? "font-sans" : "font-mono",
                !formattedDisplay && "text-muted-foreground/35"
              )}
            >
              {formattedDisplay || placeholder}
            </span>
          </Button>
        }
      >
        <Calendar
          key={
            open
              ? selectedDate
                ? selectedDate.toISOString()
                : "open"
              : "closed"
          }
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate || minDate || new Date()}
          onSelect={handleSelect}
          locale={locale}
          calendarType={calendarType}
          showOffDays={showOffDays}
          observeOfficialHolidays={observeOfficialHolidays}
          isOffDay={isOffDay}
          offDays={offDays}
          disabled={
            minDate || maxDate
              ? (date: Date) => {
                  if (minDate && date < minDate) return true
                  if (maxDate && date > maxDate) return true
                  return false
                }
              : undefined
          }
          autoFocus
        />
      </ResponsivePopover>

      {clearable && selectedDate && !disabled && (
        <Button
          type="button"
          tabIndex={-1}
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="size-7 rounded-lg p-0 text-muted-foreground hover:text-foreground"
          aria-label="Clear date"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
