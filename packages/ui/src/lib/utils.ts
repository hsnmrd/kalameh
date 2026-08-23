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

/**
 * Resolves a full absolute URL for static assets and uploaded files served by the API.
 */
export function getAssetUrl(
  path: string | null | undefined,
  fallbackBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
): string {
  if (!path) return ""
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path
  }

  let baseUrl = fallbackBaseUrl.replace(/\/+$/, "")
  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    baseUrl = baseUrl.replace(
      /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/,
      `$1${window.location.hostname}$3`
    )
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}
