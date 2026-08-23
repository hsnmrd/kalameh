import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
/**
 * Converts ASCII digits (0-9) to Persian digits (۰-۹).
 */
export function toPersianDigits(value) {
  if (value === null || value === undefined) return ""
  return String(value).replace(
    /\d/g,
    (d) => PERSIAN_DIGITS[parseInt(d, 10)] ?? d
  )
}
/**
 * Format a number according to locale (with digit localization and comma thousand grouping).
 */
export function formatNumber(value, locale = "fa") {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    isNaN(Number(value))
  ) {
    return "-"
  }
  const num = Number(value)
  const isFa = locale.toLowerCase().startsWith("fa")
  const enFormatted = num.toLocaleString("en-US")
  return isFa ? toPersianDigits(enFormatted) : enFormatted
}
/**
 * Format a number as currency separated with commas and appended with Toman (تومان / Toman).
 */
export function formatCurrency(amount, locale = "fa", showUnit = true, unit) {
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
  const enFormatted = num.toLocaleString("en-US")
  const formattedNumber = isFa ? toPersianDigits(enFormatted) : enFormatted
  if (!showUnit) {
    return formattedNumber
  }
  const currencyUnit = unit ?? (isFa ? "تومان" : "Toman")
  return `${formattedNumber} ${currencyUnit}`
}
