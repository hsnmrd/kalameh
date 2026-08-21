import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"
import { useLocale } from "next-intl"
import {
  SUPPORTED_LOCALES,
  isRtlLocale,
  getLocaleDirection,
  type SupportedLocale,
} from "@workspace/types"

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: "fa",
  localePrefix: "always",
})

export type Locale = SupportedLocale

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)

export { isRtlLocale, getLocaleDirection }

export function useIsRtl(): boolean {
  const locale = useLocale()
  return isRtlLocale(locale)
}
