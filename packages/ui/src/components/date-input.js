"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import * as React from "react"
import { format as formatGregorian, parseISO, isValid } from "date-fns"
import { format as formatJalali, parse as parseJalali } from "date-fns-jalali"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
function toLatinDigits(str) {
  return str
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
}
export function DateInput({
  value,
  defaultValue,
  onChange,
  locale = "fa",
  calendarType,
  disabled = false,
  clearable = true,
  className,
  "data-invalid": dataInvalid,
  placeholderYear,
  placeholderMonth,
  placeholderDay,
}) {
  const isJalali = calendarType ? calendarType === "jalali" : locale === "fa"
  const yearRef = React.useRef(null)
  const monthRef = React.useRef(null)
  const dayRef = React.useRef(null)
  const [year, setYear] = React.useState("")
  const [month, setMonth] = React.useState("")
  const [day, setDay] = React.useState("")
  // Sync internal state with incoming value
  React.useEffect(() => {
    const raw = value !== undefined ? value : defaultValue
    if (!raw) {
      setYear("")
      setMonth("")
      setDay("")
      return
    }
    try {
      const parsedDate = parseISO(raw)
      if (isValid(parsedDate)) {
        if (isJalali) {
          const jalaliStr = formatJalali(parsedDate, "yyyy-MM-dd")
          const [y = "", m = "", d = ""] = jalaliStr.split("-")
          setYear(y)
          setMonth(m)
          setDay(d)
        } else {
          const gregStr = formatGregorian(parsedDate, "yyyy-MM-dd")
          const [y = "", m = "", d = ""] = gregStr.split("-")
          setYear(y)
          setMonth(m)
          setDay(d)
        }
      }
    } catch {
      // Keep existing state if invalid
    }
  }, [value, defaultValue, isJalali])
  // Try parsing and emitting ISO date when fields change
  const tryEmit = (y, m, d) => {
    if (y.length === 4 && m.length >= 1 && d.length >= 1) {
      const numYear = parseInt(y, 10)
      const numMonth = parseInt(m, 10)
      const numDay = parseInt(d, 10)
      if (
        numYear > 0 &&
        numMonth >= 1 &&
        numMonth <= 12 &&
        numDay >= 1 &&
        numDay <= 31
      ) {
        const paddedMonth = m.padStart(2, "0")
        const paddedDay = d.padStart(2, "0")
        if (isJalali) {
          try {
            const jalaliDateStr = `${y}-${paddedMonth}-${paddedDay}`
            const dateObj = parseJalali(jalaliDateStr, "yyyy-MM-dd", new Date())
            if (isValid(dateObj)) {
              const iso = formatGregorian(dateObj, "yyyy-MM-dd")
              onChange?.(iso)
              return
            }
          } catch {
            // Invalid Jalali date
          }
        } else {
          try {
            const gregDateStr = `${y}-${paddedMonth}-${paddedDay}`
            const dateObj = parseISO(gregDateStr)
            if (isValid(dateObj)) {
              const iso = formatGregorian(dateObj, "yyyy-MM-dd")
              onChange?.(iso)
              return
            }
          } catch {
            // Invalid Gregorian date
          }
        }
      }
    } else if (!y && !m && !d) {
      onChange?.(undefined)
    }
  }
  const handleYearChange = (e) => {
    const rawVal = toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 4)
    setYear(rawVal)
    tryEmit(rawVal, month, day)
    if (rawVal.length === 4) {
      monthRef.current?.focus()
      monthRef.current?.select()
    }
  }
  const handleMonthChange = (e) => {
    const rawVal = toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 2)
    const num = parseInt(rawVal, 10)
    if (rawVal.length > 0 && (num > 12 || num < 1) && rawVal.length === 2) {
      return
    }
    setMonth(rawVal)
    tryEmit(year, rawVal, day)
    if (rawVal.length === 2 || (rawVal.length === 1 && num > 1)) {
      dayRef.current?.focus()
      dayRef.current?.select()
    }
  }
  const handleDayChange = (e) => {
    const rawVal = toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 2)
    const num = parseInt(rawVal, 10)
    if (rawVal.length > 0 && (num > 31 || num < 1) && rawVal.length === 2) {
      return
    }
    setDay(rawVal)
    tryEmit(year, month, rawVal)
  }
  const handleKeyDown = (field, e) => {
    if (e.key === "Backspace") {
      if (field === "day" && !day) {
        e.preventDefault()
        monthRef.current?.focus()
      } else if (field === "month" && !month) {
        e.preventDefault()
        yearRef.current?.focus()
      }
    }
  }
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = toLatinDigits(e.clipboardData.getData("text")).replace(
      /\D/g,
      ""
    )
    if (pasted.length >= 8) {
      const y = pasted.slice(0, 4)
      const m = pasted.slice(4, 6)
      const d = pasted.slice(6, 8)
      setYear(y)
      setMonth(m)
      setDay(d)
      tryEmit(y, m, d)
      dayRef.current?.focus()
    }
  }
  const handleClear = () => {
    setYear("")
    setMonth("")
    setDay("")
    onChange?.(undefined)
    yearRef.current?.focus()
  }
  const hasValue = Boolean(year || month || day)
  return _jsxs("div", {
    className: cn(
      "relative inline-flex h-10 w-fit max-w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-2xs transition-colors focus-within:border-primary disabled:cursor-not-allowed disabled:opacity-50",
      dataInvalid && "border-destructive focus-within:border-destructive",
      className
    ),
    dir: "ltr",
    children: [
      _jsxs("div", {
        className: "flex items-center gap-1 font-mono text-sm",
        children: [
          _jsx(CalendarIcon, {
            className: "me-1 size-4 shrink-0 text-muted-foreground",
          }),
          _jsx("input", {
            ref: yearRef,
            type: "text",
            inputMode: "numeric",
            pattern: "[0-9]*",
            maxLength: 4,
            disabled: disabled,
            value: year,
            onChange: handleYearChange,
            onPaste: handlePaste,
            placeholder: placeholderYear || (isJalali ? "۱۳۸۰" : "YYYY"),
            className:
              "w-12 border-0 bg-transparent text-center text-sm font-medium text-foreground outline-hidden placeholder:font-sans placeholder:text-xs placeholder:text-muted-foreground/60",
          }),
          _jsx("span", {
            className: "text-muted-foreground/40 select-none",
            children: "/",
          }),
          _jsx("input", {
            ref: monthRef,
            type: "text",
            inputMode: "numeric",
            pattern: "[0-9]*",
            maxLength: 2,
            disabled: disabled,
            value: month,
            onChange: handleMonthChange,
            onKeyDown: (e) => handleKeyDown("month", e),
            onPaste: handlePaste,
            placeholder: placeholderMonth || (isJalali ? "ماه" : "MM"),
            className:
              "w-8 border-0 bg-transparent text-center text-sm font-medium text-foreground outline-hidden placeholder:font-sans placeholder:text-xs placeholder:text-muted-foreground/60",
          }),
          _jsx("span", {
            className: "text-muted-foreground/40 select-none",
            children: "/",
          }),
          _jsx("input", {
            ref: dayRef,
            type: "text",
            inputMode: "numeric",
            pattern: "[0-9]*",
            maxLength: 2,
            disabled: disabled,
            value: day,
            onChange: handleDayChange,
            onKeyDown: (e) => handleKeyDown("day", e),
            onPaste: handlePaste,
            placeholder: placeholderDay || (isJalali ? "روز" : "DD"),
            className:
              "w-8 border-0 bg-transparent text-center text-sm font-medium text-foreground outline-hidden placeholder:font-sans placeholder:text-xs placeholder:text-muted-foreground/60",
          }),
        ],
      }),
      clearable &&
        hasValue &&
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
  })
}
