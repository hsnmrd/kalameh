"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string | null | undefined
  locale?: string
  showUnit?: boolean
  unit?: string
  unitClassName?: string
}

/**
 * Format a number as currency separated with commas and appended with Toman (تومان / Toman).
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  locale = "fa",
  showUnit = true,
  unit?: string
): string {
  if (
    amount === null ||
    amount === undefined ||
    amount === "" ||
    isNaN(Number(amount))
  ) {
    return "-"
  }

  const num = Number(amount)
  const isFa = locale.toLowerCase().startsWith("fa")
  const formattedNumber = num.toLocaleString()

  if (!showUnit) {
    return formattedNumber
  }

  const currencyUnit = unit ?? (isFa ? "تومان" : "Toman")
  return `${formattedNumber} ${currencyUnit}`
}

/**
 * Accessible, standardized price / currency presentation component.
 */
export function Price({
  amount,
  locale,
  showUnit = true,
  unit,
  className,
  unitClassName,
  ...props
}: PriceProps) {
  const currentLocale =
    locale ??
    (typeof document !== "undefined" && document.documentElement.lang
      ? document.documentElement.lang
      : "fa")

  if (
    amount === null ||
    amount === undefined ||
    amount === "" ||
    isNaN(Number(amount))
  ) {
    return (
      <span className={cn("font-mono text-slate-400", className)} {...props}>
        -
      </span>
    )
  }

  const num = Number(amount)
  const isFa = currentLocale.toLowerCase().startsWith("fa")
  const formattedNumber = num.toLocaleString()
  const currencyUnit = unit ?? (isFa ? "تومان" : "Toman")

  return (
    <span
      className={cn("inline-flex items-baseline gap-1 font-mono", className)}
      {...props}
    >
      <span>{formattedNumber}</span>
      {showUnit && (
        <span
          className={cn(
            "font-sans text-xs font-normal text-slate-500 opacity-85",
            unitClassName
          )}
        >
          {currencyUnit}
        </span>
      )}
    </span>
  )
}
