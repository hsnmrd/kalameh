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
  locale?: string
): string {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    isNaN(Number(value))
  ) {
    return "-"
  }

  const currentLocale =
    locale ??
    (typeof document !== "undefined" && document.documentElement.lang
      ? document.documentElement.lang
      : "fa")

  const normalizedLocale = currentLocale.toLowerCase().startsWith("fa")
    ? "fa-IR"
    : "en-US"

  const num = Number(value)
  return num.toLocaleString(normalizedLocale)
}

/**
 * Format a number as currency separated with commas and appended with Toman (تومان / Toman).
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  locale?: string,
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

  const currentLocale =
    locale ??
    (typeof document !== "undefined" && document.documentElement.lang
      ? document.documentElement.lang
      : "fa")

  const isFa = currentLocale.toLowerCase().startsWith("fa")
  const num = Number(amount)
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

  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  if (fallbackBaseUrl.startsWith("/")) {
    return normalizedPath
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

  return `${baseUrl}${normalizedPath}`
}

/**
 * Format a date string or Date object according to locale (Persian solar calendar for fa, Gregorian for others).
 */
export function formatDate(
  dateVal: string | Date | null | undefined,
  locale?: string
): string {
  if (!dateVal) return "-"
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return "-"
    const currentLocale =
      locale ??
      (typeof document !== "undefined" && document.documentElement.lang
        ? document.documentElement.lang
        : "fa")

    const isFa = currentLocale.toLowerCase().startsWith("fa")
    return new Intl.DateTimeFormat(isFa ? "fa-IR-u-ca-persian" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d)
  } catch {
    return String(dateVal)
  }
}

/**
 * Maps known course and book series names (English and Persian transliterations)
 * to their standard short acronyms (e.g. "American English File" -> "AEF").
 */
const KNOWN_SERIES_ACRONYMS: Record<string, string> = {
  // English titles
  "american english file": "AEF",
  "family and friends": "FF",
  "family & friends": "FF",
  "first friends": "FF",
  "top notch": "TN",
  summit: "Summit",
  touchstone: "TS",
  viewpoint: "VP",
  "four corners": "FC",
  "english file": "EF",
  "let's go": "LG",
  "lets go": "LG",
  interchange: "IC",
  "oxford phonics world": "OPW",
  "oxford phonics": "OP",
  solutions: "SOL",
  headway: "HW",
  speakout: "SO",
  "got it": "GI",
  teen2teen: "T2T",
  "big english": "BE",
  "super minds": "SM",
  "super safari": "SS",
  "kid's box": "KB",
  "kids box": "KB",
  "english time": "ET",
  "hip hip hooray": "HHH",
  connect: "Connect",
  project: "Project",
  pockets: "Pockets",
  backpack: "Backpack",

  // Persian transliterations
  "امریکن انگلیش فایل": "AEF",
  "امریکن اینگلیش فایل": "AEF",
  "فمیلی اند فرندز": "FF",
  "فرست فرندز": "FF",
  "تاپ ناچ": "TN",
  سامیت: "Summit",
  "تاچ استون": "TS",
  ویوپوینت: "VP",
  "فور کرنرز": "FC",
  "انگلیش فایل": "EF",
  "لتس گو": "LG",
  اینترچنج: "IC",
  سولوشنز: "SOL",
  هدوی: "HW",
  "اسپیک اوت": "SO",
  "گات ایت": "GI",
  "تین تو تین": "T2T",
  "بیگ انگلیش": "BE",
  "سوپر مایندز": "SM",
  "سوپر سافاری": "SS",
  "کیدز باکس": "KB",
}

/**
 * Normalizes Persian and Arabic digits to ASCII digits.
 */
function normalizeDigitsToAscii(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

/**
 * Formats a full course title into a concise, readable short form.
 * E.g. "American English File 3 - 5" -> "AEF 3-5"
 * E.g. "American English File 1 - 2" -> "AEF 1-2"
 * E.g. "American English File 1 - 1" -> "AEF 1-1"
 * E.g. "American English File Starter - 1" -> "AEF Starter-1"
 * E.g. "Top Notch 1A - 2" -> "TN 1A-2"
 */
export function formatCourseShortTitle(
  title: string | null | undefined
): string {
  if (!title) return ""

  const trimmed = title.trim()
  if (!trimmed) return ""

  // Normalize digits (Persian/Arabic to ASCII) and dashes
  const normalized = normalizeDigitsToAscii(trimmed)
    .replace(/[–—−ـ]/g, "-")
    .replace(/\s+/g, " ")
    .trim()

  // Match optional term/part/index suffix after dash: e.g. " - 5", " - Term 5", " - Part 5", " - ترم 5"
  const suffixMatch = normalized.match(
    /\s*-\s*(?:term|part|ترم|پارت|قسمت)?\s*([0-9a-zA-Z]+)\s*$/i
  )

  let basePart = normalized
  let suffixIndex = ""

  if (suffixMatch && suffixMatch.index !== undefined) {
    suffixIndex = suffixMatch[1] ?? ""
    basePart = normalized.slice(0, suffixMatch.index).trim()
  }

  // From basePart, detect trailing volume/level (e.g. "3", "1A", "Starter", "Fundamentals A", etc.)
  const volumeMatch = basePart.match(
    /^(.*?)\s+([0-9]+[a-zA-Z]?|starter|fundamentals(?:\s+[a-zA-Z])?|مقدماتی|پیشرفته|استارتر)\s*$/i
  )

  let seriesName = basePart
  let volumeLevel = ""

  if (volumeMatch && volumeMatch[1] && volumeMatch[2]) {
    seriesName = volumeMatch[1].trim()
    volumeLevel = volumeMatch[2].trim()
  }

  // Look up series in known acronyms
  const lowerSeries = seriesName.toLowerCase()
  let shortSeries = KNOWN_SERIES_ACRONYMS[lowerSeries]

  if (!shortSeries) {
    // If multiple English words, create acronym from first letters
    const words = seriesName.split(/\s+/).filter(Boolean)
    const isAscii = /^[a-zA-Z\s&']+$/.test(seriesName)

    if (isAscii && words.length >= 2) {
      // e.g. "General English Conversation" -> "GEC"
      shortSeries = words
        .filter((w) => !/^(and|&|of|the|in|for)$/i.test(w))
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    } else {
      shortSeries = seriesName
    }
  }

  // Compose formatted short title
  if (volumeLevel && suffixIndex) {
    return `${shortSeries} ${volumeLevel}-${suffixIndex}`
  }
  if (volumeLevel && !suffixIndex) {
    return `${shortSeries} ${volumeLevel}`
  }
  if (!volumeLevel && suffixIndex) {
    return `${shortSeries}-${suffixIndex}`
  }
  return shortSeries
}
