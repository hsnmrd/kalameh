"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface PriceInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange"
> {
  value?: number | string | null
  defaultValue?: number | string | null
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onValueChange?: (value: number | null) => void
  locale?: string
  unit?: string
  showUnit?: boolean
  unitClassName?: string
}

/**
 * Converts Persian and Arabic digits to ASCII digits and strips non-digit characters.
 */
export function sanitizeNumericString(
  value: string | number | null | undefined
): string {
  if (value === null || value === undefined || value === "") return ""
  return String(value)
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
    .replace(/[^0-9]/g, "")
}

/**
 * Formats a raw number or numeric string with comma 3-by-3 grouping.
 */
export function formatPriceDisplay(
  value: string | number | null | undefined
): string {
  const digits = sanitizeNumericString(value)
  if (!digits) return ""
  const num = Number(digits)
  if (isNaN(num)) return ""
  return num.toLocaleString("en-US")
}

/**
 * Parses numeric input string into an integer or null.
 */
export function parsePriceNumber(
  value: string | number | null | undefined
): number | null {
  const digits = sanitizeNumericString(value)
  if (!digits) return null
  const num = Number(digits)
  return isNaN(num) ? null : num
}

const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  (
    {
      className,
      value,
      defaultValue,
      onChange,
      onValueChange,
      locale,
      unit,
      showUnit = true,
      unitClassName,
      dir,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(() =>
      formatPriceDisplay(isControlled ? value : defaultValue)
    )

    // Sync with controlled value changes
    React.useEffect(() => {
      if (isControlled) {
        setInternalValue(formatPriceDisplay(value))
      }
    }, [isControlled, value])

    // Detect active locale for currency unit
    const currentLocale =
      locale ??
      (typeof document !== "undefined" && document.documentElement.lang
        ? document.documentElement.lang
        : "fa")
    const isFa = currentLocale.toLowerCase().startsWith("fa")
    const currencyUnit = unit ?? (isFa ? "تومان" : "Toman")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputEl = e.target
      const originalValue = inputEl.value
      const selectionStart = inputEl.selectionStart ?? originalValue.length

      // Count digits before the cursor to preserve cursor position
      const digitsBeforeCursor = sanitizeNumericString(
        originalValue.slice(0, selectionStart)
      ).length

      const numericValue = parsePriceNumber(originalValue)
      const formatted = formatPriceDisplay(originalValue)

      if (!isControlled) {
        setInternalValue(formatted)
      }

      // Notify consumer of parsed number
      onValueChange?.(numericValue)

      // Invoke standard onChange if provided
      if (onChange) {
        onChange(e)
      }

      // Restore cursor position after formatting
      requestAnimationFrame(() => {
        if (!inputRef.current) return
        const newFormatted = inputRef.current.value
        let newCursorPos = 0
        let digitCount = 0

        for (let i = 0; i < newFormatted.length; i++) {
          if (/[0-9]/.test(newFormatted[i]!)) {
            digitCount++
          }
          if (digitCount === digitsBeforeCursor) {
            newCursorPos = i + 1
            break
          }
        }

        if (digitCount < digitsBeforeCursor) {
          newCursorPos = newFormatted.length
        }

        inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
      })
    }

    const displayValue = isControlled
      ? formatPriceDisplay(value)
      : internalValue

    return (
      <div dir={dir} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          dir={dir}
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "flex h-14 w-full rounded-2xl border border-border bg-background ps-4 pe-16 font-mono text-base text-foreground shadow-2xs transition-colors placeholder:font-sans placeholder:text-muted-foreground/35 focus:border-2 focus:border-ring focus:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {showUnit && (
          <span
            className={cn(
              "pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 font-sans text-xs font-normal text-muted-foreground select-none sm:text-sm",
              disabled && "opacity-50",
              unitClassName
            )}
            aria-hidden="true"
          >
            {currencyUnit}
          </span>
        )}
      </div>
    )
  }
)

PriceInput.displayName = "PriceInput"

export { PriceInput }
