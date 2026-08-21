export const RTL_LOCALES = ["fa", "ar", "he", "ur"] as const
export type RtlLocale = (typeof RTL_LOCALES)[number]

export const SUPPORTED_LOCALES = ["en", "fa"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
