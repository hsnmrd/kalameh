// ---------------------------------------------------------------------------
// Digit / Time Helpers
// ---------------------------------------------------------------------------

const FARSI_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]

export function toPersianDigits(n: number | string): string {
  return n.toString().replace(/\d/g, (x) => FARSI_DIGITS[Number(x)] ?? x)
}

export function toLatinDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
}

export function parseTimeString(
  timeStr?: string | null
): { hour: number; minute: number } | null {
  if (!timeStr) return null
  const latinStr = toLatinDigits(timeStr).trim()
  const match = latinStr.match(/^(\d{1,2}):(\d{1,2})$/)
  if (!match) return null

  const hour = parseInt(match[1]!, 10)
  const minute = parseInt(match[2]!, 10)
  if (
    isNaN(hour) ||
    isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }
  return { hour, minute }
}

export function formatTimeString(hour: number, minute: number): string {
  const h = String(hour).padStart(2, "0")
  const m = String(minute).padStart(2, "0")
  return `${h}:${m}`
}

export function getCurrentTimeString(): string {
  const now = new Date()
  return formatTimeString(now.getHours(), now.getMinutes())
}

export function safeScrollTo(
  container: HTMLElement,
  top: number,
  behavior: ScrollBehavior = "smooth"
) {
  if (typeof container.scrollTo === "function") {
    container.scrollTo({ top, behavior })
  } else {
    container.scrollTop = top
  }
}
