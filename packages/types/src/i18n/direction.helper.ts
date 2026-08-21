import { RTL_LOCALES, type RtlLocale } from "./locales.constant.js"

export const isRtlLocale = (locale?: string | null): boolean => {
  if (!locale) return false
  return (RTL_LOCALES as readonly string[]).includes(locale.toLowerCase())
}

export const getLocaleDirection = (locale?: string | null): "rtl" | "ltr" => {
  return isRtlLocale(locale) ? "rtl" : "ltr"
}
