import type { NavSection, NavItemKey } from "../nav-list"

export interface MobileBottomNavigationProps {
  sections: NavSection[]
  pathname: string
  onLogout: () => void
  onSwitchLanguage?: () => void
  locale?: string
  focusedKey?: NavItemKey | null
}
