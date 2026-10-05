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
