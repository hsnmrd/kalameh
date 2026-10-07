import { SUPPORTED_LOCALES, type SupportedLocale } from "@workspace/types"
import type { NavItem, NavItemKey } from "../nav-list"

export const DIRECT_ITEM_PRIORITY: NavItemKey[] = [
  "platformDashboard",
  "instituteDashboard",
  "dashboard",
  "institutes",
  "classes",
  "students",
  "finance",
]

export const MAX_DIRECT_ITEMS = 4

export function isItemActive(item: NavItem, pathname: string) {
  return item.href === "/"
    ? pathname === "/" || pathname === ""
    : pathname.startsWith(item.href)
}

/**
 * Determines whether a pathname represents an inner / sub-page (e.g. /calendar/custom,
 * /classes/scheduling, /teachers/calendar) rather than a top-level section page (e.g.
 * /calendar, /classes, /teachers, /dashboard, /overview).
 */
export function isInnerPage(pathname?: string | null): boolean {
  if (!pathname) return false

  // Strip query parameters and hash fragments
  const [withoutQuery] = pathname.split("?")
  const [cleanPath] = (withoutQuery ?? "").split("#")

  if (!cleanPath) return false

  // Strip leading and trailing slashes, then split into path segments
  const segments = cleanPath
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)

  // Strip locale prefix if present (e.g. "fa", "en")
  const firstSegment = segments[0]
  if (
    firstSegment &&
    SUPPORTED_LOCALES.includes(firstSegment as SupportedLocale)
  ) {
    segments.shift()
  }

  // Inner pages have 2 or more path segments
  return segments.length >= 2
}
