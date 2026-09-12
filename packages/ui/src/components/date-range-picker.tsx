"use client"

import * as React from "react"
import { format as formatGregorian, parseISO, isValid } from "date-fns"
import { format as formatJalali } from "date-fns-jalali"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { ResponsivePopover } from "@workspace/ui/components/popover"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { DrawerFooter } from "@workspace/ui/components/drawer"
import {
  Calendar,
  type CalendarLocale,
} from "@workspace/ui/components/calendar"

export interface DateRangeValue {
  from?: string | Date | null
  to?: string | Date | null
}

export interface DateRangePickerProps {
  value?: DateRangeValue | null
  defaultValue?: DateRangeValue | null
  onChange?: (value: { from: string; to: string } | undefined) => void
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

export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  locale = "fa",
  calendarType,
  placeholder = locale === "fa" ? "انتخاب تاریخ..." : "Select date...",
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
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const isJalali = calendarType ? calendarType === "jalali" : locale === "fa"

  // Parse current value to Date range object
  const selectedRange = React.useMemo<
    { from: Date; to?: Date } | undefined
  >(() => {
    const raw = value !== undefined ? value : defaultValue
    if (!raw) return undefined

    const parseDate = (
      d: string | Date | null | undefined
    ): Date | undefined => {
      if (!d) return undefined
      if (d instanceof Date) return isValid(d) ? d : undefined
      const parsed = parseISO(d)
      return isValid(parsed) ? parsed : undefined
    }

    const from = parseDate(raw.from)
    const to = parseDate(raw.to)

    if (!from && !to) return undefined
    const validFrom = from ?? to!
    return { from: validFrom, to: to ?? validFrom }
  }, [value, defaultValue])

  // In-progress selection within the open popover
  const [draftRange, setDraftRange] = React.useState<
    { from: Date; to?: Date } | undefined
  >(selectedRange)

  React.useEffect(() => {
    if (open) {
      setDraftRange(selectedRange)
    }
  }, [open, selectedRange])

  // Count of days in current draft selection
  const draftDaysCount = React.useMemo(() => {
    if (!draftRange?.from) return 0
    const from = draftRange.from
    const to = draftRange.to || from
    const diff =
      Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diff)
  }, [draftRange])

  // Format date display based on calendar system
  const formattedDisplay = React.useMemo(() => {
    if (!selectedRange?.from) return null
    try {
      const fromDate = selectedRange.from
      const toDate = selectedRange.to || fromDate
      const pattern = isJalali ? "yyyy/MM/dd" : "yyyy-MM-dd"
      const fromStr = isJalali
        ? formatJalali(fromDate, pattern)
        : formatGregorian(fromDate, pattern)
      const toStr = isJalali
        ? formatJalali(toDate, pattern)
        : formatGregorian(toDate, pattern)

      if (fromStr === toStr) {
        return fromStr
      }
      return isJalali ? `${fromStr} تا ${toStr}` : `${fromStr} - ${toStr}`
    } catch {
      return null
    }
  }, [selectedRange, isJalali])

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range?.from) {
      setDraftRange(undefined)
      return
    }
    setDraftRange({ from: range.from, to: range.to })
  }

  const handleConfirm = () => {
    if (!draftRange?.from) return
    const fromDate = draftRange.from
    const toDate = draftRange.to || fromDate
    const fromStr = formatGregorian(fromDate, "yyyy-MM-dd")
    const toStr = formatGregorian(toDate, "yyyy-MM-dd")
    onChange?.({ from: fromStr, to: toStr })
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraftRange(undefined)
    onChange?.(undefined)
  }

  const isMobile = useIsMobile()

  const desktopPopupContent = (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
      <Calendar
        key={
          open
            ? draftRange?.from
              ? draftRange.from.toISOString()
              : "open"
            : "closed"
        }
        mode="range"
        selected={draftRange}
        defaultMonth={
          draftRange?.from || selectedRange?.from || minDate || new Date()
        }
        onSelect={handleSelect as any}
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
        className="border-0 p-0 shadow-none"
        autoFocus
      />
      <div className="flex items-center justify-between gap-2 border-t border-border/80 px-1 pt-3">
        <div className="text-xs text-muted-foreground">
          {draftRange?.from && (
            <span>
              {draftDaysCount > 1
                ? locale === "fa"
                  ? `${draftDaysCount} روز انتخاب شده`
                  : `${draftDaysCount} days selected`
                : locale === "fa"
                  ? "۱ روز انتخاب شده"
                  : "1 day selected"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {clearable && draftRange?.from && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setDraftRange(undefined)
                onChange?.(undefined)
              }}
              className="h-9 cursor-pointer rounded-xl px-3 text-sm font-medium"
            >
              {locale === "fa" ? "پاک کردن" : "Clear"}
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            onClick={handleConfirm}
            disabled={!draftRange?.from}
            className="h-9 cursor-pointer rounded-xl px-4 text-sm font-medium"
          >
            {locale === "fa" ? "تأیید" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  )

  const mobileDrawerBody = (
    <div className="flex w-full flex-col items-center justify-center py-2">
      <Calendar
        key={
          open
            ? draftRange?.from
              ? draftRange.from.toISOString()
              : "open"
            : "closed"
        }
        mode="range"
        selected={draftRange}
        defaultMonth={
          draftRange?.from || selectedRange?.from || minDate || new Date()
        }
        onSelect={handleSelect as any}
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
        className="border-0 p-0 shadow-none"
        autoFocus
      />
    </div>
  )

  const mobileDrawerFooter = (
    <DrawerFooter className="flex flex-col gap-2.5 px-4 pt-2 pb-6">
      {draftRange?.from && (
        <div className="pb-0.5 text-center text-xs font-medium text-muted-foreground">
          {draftDaysCount > 1
            ? locale === "fa"
              ? `${draftDaysCount} روز انتخاب شده`
              : `${draftDaysCount} days selected`
            : locale === "fa"
              ? "۱ روز انتخاب شده"
              : "1 day selected"}
        </div>
      )}
      <div className="flex w-full items-center gap-2">
        {clearable && (draftRange?.from || selectedRange?.from) ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraftRange(undefined)
              onChange?.(undefined)
            }}
            className="h-14 flex-1 cursor-pointer rounded-2xl text-base font-medium"
          >
            {locale === "fa" ? "پاک کردن" : "Clear"}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-14 flex-1 cursor-pointer rounded-2xl text-base font-medium"
          >
            {locale === "fa" ? "انصراف" : "Cancel"}
          </Button>
        )}
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={!draftRange?.from}
          className="h-14 flex-1 cursor-pointer rounded-2xl text-base font-medium"
        >
          {locale === "fa" ? "تأیید" : "Confirm"}
        </Button>
      </div>
    </DrawerFooter>
  )

  if (variant === "inline") {
    return (
      <ResponsivePopover
        open={open}
        onOpenChange={setOpen}
        drawerTitle={
          drawerTitle ??
          (locale === "fa" ? "انتخاب بازه تاریخ" : "Select date range")
        }
        drawerFooter={mobileDrawerFooter}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
        drawerBodyClassName="flex justify-center px-4 pb-2"
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
        {isMobile ? mobileDrawerBody : desktopPopupContent}
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
          drawerTitle ??
          (locale === "fa" ? "انتخاب بازه تاریخ" : "Select date range")
        }
        drawerFooter={mobileDrawerFooter}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
        drawerBodyClassName="flex justify-center px-4 pb-2"
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
        {isMobile ? mobileDrawerBody : desktopPopupContent}
      </ResponsivePopover>

      {clearable && selectedRange && !disabled && (
        <Button
          type="button"
          tabIndex={-1}
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="size-7 rounded-lg p-0 text-muted-foreground hover:text-foreground"
          aria-label={
            locale === "fa" ? "پاک کردن بازه تاریخ" : "Clear date range"
          }
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
