export const RTL_LOCALES = ["fa", "ar", "he", "ur"] as const
export type RtlLocale = (typeof RTL_LOCALES)[number]

export const SUPPORTED_LOCALES = ["fa", "en"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export interface LocaleDefinition {
  code: SupportedLocale
  name: string
  nativeName: string
  dir: "rtl" | "ltr"
  directionLabel: "RTL" | "LTR"
}

export const LOCALES_METADATA: Record<SupportedLocale, LocaleDefinition> = {
  fa: {
    code: "fa",
    name: "Persian",
    nativeName: "فارسی",
    dir: "rtl",
    directionLabel: "RTL",
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    dir: "ltr",
    directionLabel: "LTR",
  },
}

export const LOCALES_LIST: readonly LocaleDefinition[] = SUPPORTED_LOCALES.map(
  (locale) => LOCALES_METADATA[locale]
)
