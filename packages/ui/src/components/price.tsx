"use client"

import * as React from "react"
import { cn, formatCurrency } from "@workspace/ui/lib/utils"

export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string | null | undefined
  locale?: string
  showUnit?: boolean
  unit?: string
  unitClassName?: string
}

export { formatCurrency }

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
      <span className={cn("text-muted-foreground", className)} {...props}>
        -
      </span>
    )
  }

  const num = Number(amount)
  const isFa = currentLocale.toLowerCase().startsWith("fa")
  const formattedNumber = num.toLocaleString("en-US")
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
            "font-sans text-xs font-normal text-muted-foreground opacity-85",
            unitClassName
          )}
        >
          {currencyUnit}
        </span>
      )}
    </span>
  )
}
