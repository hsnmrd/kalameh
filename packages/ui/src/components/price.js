"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { cn, toPersianDigits, formatCurrency } from "@workspace/ui/lib/utils"
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
}) {
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
    return _jsx("span", {
      className: cn("text-muted-foreground", className),
      ...props,
      children: "-",
    })
  }
  const num = Number(amount)
  const isFa = currentLocale.toLowerCase().startsWith("fa")
  const enFormatted = num.toLocaleString("en-US")
  const formattedNumber = isFa ? toPersianDigits(enFormatted) : enFormatted
  const currencyUnit = unit ?? (isFa ? "تومان" : "Toman")
  return _jsxs("span", {
    className: cn(
      "inline-flex items-baseline gap-1",
      isFa ? "font-sans" : "font-mono",
      className
    ),
    ...props,
    children: [
      _jsx("span", { children: formattedNumber }),
      showUnit &&
        _jsx("span", {
          className: cn(
            "font-sans text-xs font-normal text-muted-foreground opacity-85",
            unitClassName
          ),
          children: currencyUnit,
        }),
    ],
  })
}
