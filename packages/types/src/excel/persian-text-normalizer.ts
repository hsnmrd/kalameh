/**
 * Persian and Arabic numeral characters.
 */
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

/**
 * Normalizes Persian and Arabic numerals to standard Latin digits (0-9).
 */
export function normalizeDigits(str?: string | null): string {
  if (!str) return ""
  return str
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1584))
    .trim()
}

/**
 * Normalizes Persian and Arabic text for comparison, lookup maps, and key matching:
 * - Converts Arabic Yeh (ي, ى) to Persian Yeh (ی)
 * - Converts Arabic Kaf (ك) to Persian Keheh (ک)
 * - Converts Arabic Ta Marbuta (ة) to Heh (ه)
 * - Converts Alef with Hamza / Wasla (أ, إ, ٱ) to simple Alef (ا)
 * - Strips Arabic Harakat / Tashkeel (اعراب، تنوین، تشدید، سکون)
 * - Normalizes Zero-Width Non-Joiner (ZWNJ: \u200C) and ZWJ (\u200D) into standard whitespace
 * - Converts Persian & Arabic numerals to standard Latin digits
 * - Normalizes excessive and non-breaking whitespace to a single space
 * - Lowercases Latin characters for case-insensitive matching
 */
export function normalizePersianText(str?: string | null): string {
  if (!str) return ""
  return normalizeDigits(str)
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove Harakat/Tashkeel
    .replace(/[\u200C\u200D\uFEFF]/g, " ") // ZWNJ, ZWJ, BOM -> space
    .replace(/\u064A/g, "\u06CC") // Arabic Yeh -> Persian Yeh (ي -> ی)
    .replace(/\u0649/g, "\u06CC") // Arabic Alef Maksura -> Persian Yeh (ى -> ی)
    .replace(/\u0643/g, "\u06A9") // Arabic Kaf -> Persian Keheh (ك -> ک)
    .replace(/\u0629/g, "\u0647") // Ta Marbuta -> Heh (ة -> ه)
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627") // آ, أ, إ, ٱ -> ا
    .replace(/[_\-]+/g, " ") // replace underscores / dashes in headers/keys with spaces
    .replace(/[\s\u00A0\u180E\u2000-\u200B\u202F\u205F\u3000]+/g, " ") // normalize all whitespaces
    .trim()
    .toLowerCase()
}

/**
 * Cleans Persian text for data storage while preserving readable Persian letters:
 * - Converts Arabic Yeh (ي, ى) to Persian Yeh (ی)
 * - Converts Arabic Kaf (ك) to Persian Keheh (ک)
 * - Converts Arabic Ta Marbuta (ة) to Heh (ه)
 * - Strips unwanted Harakat / Tashkeel
 * - Normalizes multiple whitespaces into a single space
 */
export function cleanPersianText(str?: string | null): string {
  if (!str) return ""
  return str
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove Harakat
    .replace(/\u064A/g, "\u06CC") // ي -> ی
    .replace(/\u0649/g, "\u06CC") // ى -> ی
    .replace(/\u0643/g, "\u06A9") // ك -> ک
    .replace(/\u0629/g, "\u0647") // ة -> ه
    .replace(/[\s\u00A0\u180E\u2000-\u200B\u202F\u205F\u3000]+/g, " ")
    .trim()
}

/**
 * Checks if two Persian strings are equal taking into account Persian/Arabic spelling variations,
 * optional spaces, half-spaces (ZWNJs), and diacritics.
 */
export function isPersianTextEqual(
  a?: string | null,
  b?: string | null
): boolean {
  if (!a && !b) return true
  if (!a || !b) return false
  const normA = normalizePersianText(a)
  const normB = normalizePersianText(b)
  if (normA === normB) return true
  return normA.replace(/\s+/g, "") === normB.replace(/\s+/g, "")
}
