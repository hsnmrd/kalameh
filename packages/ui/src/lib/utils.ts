import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number according to locale (with comma thousand grouping).
 */
export function formatNumber(
  value: number | string | null | undefined,
  _locale = "fa"
): string {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    isNaN(Number(value))
  ) {
    return "-"
  }

  const num = Number(value)
  return num.toLocaleString("en-US")
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
  const formattedNumber = num.toLocaleString("en-US")

  if (!showUnit) {
    return formattedNumber
  }

  const currencyUnit = unit ?? (isFa ? "تومان" : "Toman")
  return `${formattedNumber} ${currencyUnit}`
}
