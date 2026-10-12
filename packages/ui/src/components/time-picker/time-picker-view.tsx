"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { ResponsivePopover } from "@workspace/ui/components/popover"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  parseTimeString,
  formatTimeString,
  getCurrentTimeString,
  toPersianDigits,
} from "./helpers"
import { TimeWheelPicker } from "./time-wheel-picker"
import type { TimePickerProps } from "./types"

export type { TimePickerProps }

export function TimePicker({
  value,
  defaultValue,
  onChange,
  locale = "fa",
  placeholder,
  disabled = false,
  clearable = true,
  className,
  "data-invalid": dataInvalid,
  minTime,
  maxTime,
  minuteStep = 1,
  showLabels = false,
  drawerTitle,
  confirmLabel,
  clearLabel,
  nowLabel,
  variant = "default",
  id,
  name,
  itemHeight = 40,
  visibleCount = 5,
}: TimePickerProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const isFa = locale === "fa"
  const defaultPlaceholder = isFa ? "انتخاب زمان..." : "Select time..."
  const effectivePlaceholder = placeholder ?? defaultPlaceholder
  const effectiveConfirmLabel = confirmLabel ?? (isFa ? "تأیید" : "Confirm")
  const effectiveNowLabel = nowLabel ?? (isFa ? "اکنون" : "Now")

  const [prevValue, setPrevValue] = React.useState(value)
  const [draftTime, setDraftTime] = React.useState<string>(() => {
    return value || defaultValue || getCurrentTimeString()
  })

  if (value !== prevValue) {
    setPrevValue(value)
    if (value) {
      setDraftTime(value)
    }
  }

  const formattedDisplay = React.useMemo(() => {
    if (!value) return null
    const parsed = parseTimeString(value)
    if (!parsed) return value
    const formatted = formatTimeString(parsed.hour, parsed.minute)
    return isFa ? toPersianDigits(formatted) : formatted
  }, [value, isFa])

  const handleWheelChange = (newVal: string) => {
    setDraftTime(newVal)
    onChange?.(newVal)
  }

  const handleConfirm = () => {
    onChange?.(draftTime)
    setOpen(false)
  }

  const handleSetNow = () => {
    const now = getCurrentTimeString()
    setDraftTime(now)
    onChange?.(now)
    setOpen(false)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange?.(undefined)
    setOpen(false)
  }

  const mobileDrawerFooter = (
    <div className="flex w-full items-center gap-3 px-4 pt-2 pb-6">
      <Button
        type="button"
        variant="outline"
        onClick={handleSetNow}
        className="h-14 flex-1 rounded-2xl text-base font-medium"
      >
        {effectiveNowLabel}
      </Button>
      <Button
        type="button"
        onClick={handleConfirm}
        className="h-14 flex-1 rounded-2xl text-base font-semibold"
      >
        {effectiveConfirmLabel}
      </Button>
    </div>
  )

  const pickerWheel = (
    <TimeWheelPicker
      value={draftTime}
      onChange={handleWheelChange}
      locale={locale}
      minuteStep={minuteStep}
      minTime={minTime}
      maxTime={maxTime}
      showLabels={showLabels}
      itemHeight={itemHeight}
      visibleCount={visibleCount}
    />
  )

  const desktopFooter = (
    <div className="flex w-full items-center gap-2 border-t border-border/60 pt-2.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSetNow}
        className="h-9 flex-1 rounded-xl text-xs font-medium"
      >
        {effectiveNowLabel}
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={handleConfirm}
        className="h-9 flex-1 rounded-xl text-xs font-semibold"
      >
        {effectiveConfirmLabel}
      </Button>
    </div>
  )

  const popoverContent = isMobile ? (
    <div className="w-full">{pickerWheel}</div>
  ) : (
    <div className="flex w-full flex-col gap-2.5">
      {pickerWheel}
      {desktopFooter}
    </div>
  )

  if (variant === "inline") {
    return (
      <div className={cn("inline-flex items-center", className)}>
        {id && (
          <input
            id={id}
            name={name}
            type="text"
            tabIndex={-1}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            aria-hidden="true"
            className="sr-only"
          />
        )}
        <ResponsivePopover
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen && !value) {
              setDraftTime(defaultValue || getCurrentTimeString())
            }
            setOpen(nextOpen)
          }}
          drawerTitle={drawerTitle ?? (isFa ? "انتخاب زمان" : "Select time")}
          onClear={clearable && value ? () => handleClear() : undefined}
          clearLabel={clearLabel ?? (isFa ? "پاک کردن" : "Clear")}
          className="w-64 p-2.5 sm:w-72"
          drawerBodyClassName="w-full px-4 py-1 pb-4"
          drawerFooter={mobileDrawerFooter}
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={cn(
                "group inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-foreground transition-colors select-none hover:bg-muted hover:text-primary disabled:cursor-not-allowed",
                dataInvalid && "text-destructive"
              )}
            >
              <span
                dir="ltr"
                className={cn(
                  isFa ? "font-sans" : "font-mono",
                  !formattedDisplay && "text-muted-foreground/35"
                )}
              >
                {formattedDisplay || effectivePlaceholder}
              </span>
              <Clock className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </Button>
          }
        >
          {popoverContent}
        </ResponsivePopover>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex h-14 w-full items-center justify-between rounded-2xl border border-border bg-background px-4 text-base text-foreground shadow-2xs transition-colors focus-within:border-2 focus-within:border-ring focus-within:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
        dataInvalid && "border-destructive focus-within:border-destructive",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {id && (
        <input
          id={id}
          name={name}
          type="text"
          tabIndex={-1}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          aria-hidden="true"
          className="sr-only"
        />
      )}
      <ResponsivePopover
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen && !value) {
            setDraftTime(defaultValue || getCurrentTimeString())
          }
          setOpen(nextOpen)
        }}
        drawerTitle={drawerTitle ?? (isFa ? "انتخاب زمان" : "Select time")}
        onClear={clearable && value ? () => handleClear() : undefined}
        clearLabel={clearLabel ?? (isFa ? "پاک کردن" : "Clear")}
        className="w-72 p-2.5 sm:w-80"
        drawerBodyClassName="w-full px-4 py-1 pb-4"
        drawerFooter={mobileDrawerFooter}
        trigger={
          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className="flex h-full min-w-0 flex-1 cursor-pointer items-center justify-start gap-2.5 p-0 text-start text-base font-normal outline-hidden select-none hover:bg-transparent disabled:cursor-not-allowed"
          >
            <Clock className="size-5 shrink-0 text-muted-foreground" />
            <span
              dir="ltr"
              className={cn(
                "flex-1 text-base",
                isFa ? "font-sans" : "font-mono",
                !formattedDisplay && "text-muted-foreground/35"
              )}
            >
              {formattedDisplay || effectivePlaceholder}
            </span>
          </Button>
        }
      >
        {popoverContent}
      </ResponsivePopover>
    </div>
  )
}
