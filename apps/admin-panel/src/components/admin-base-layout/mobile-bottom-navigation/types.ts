import type { NavSection } from "../nav-list"

export interface MobileBottomNavigationProps {
  sections: NavSection[]
  pathname: string
  onLogout: () => void
  onSwitchLanguage?: () => void
  locale?: string
}
