"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type { Permission, AppModule } from "@workspace/types"
import { ROLES } from "@workspace/types"
import { Link } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import { usePermissions } from "@/lib/hooks"
import { useActiveInstitute } from "@/lib/stores"

export type NavItemKey =
  | "dashboard"
  | "institutes"
  | "classes"
  | "branches"
  | "terms"
  | "courses"
  | "students"
  | "staff"
  | "rolePermissions"
  | "finance"

export interface NavItem {
  key: NavItemKey
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission | readonly Permission[]
  module?: AppModule
}

export interface NavSection {
  id: string
  title?: string
  badge?: string
  items: NavItem[]
}

export interface NavListProps {
  sections?: NavSection[]
  items?: NavItem[]
  pathname: string
  onItemClick?: () => void
}

export function NavList({
  sections,
  items,
  pathname,
  onItemClick,
}: NavListProps) {
  const t = useTranslations("common.nav")
  const { hasPermission, user } = usePermissions()
  const { activeInstitute } = useActiveInstitute()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const enabledModules = activeInstitute?.enabledModules || []

  const hasModuleAccess = React.useCallback(
    (module?: AppModule) => {
      if (!module || isSuperAdmin) return true
      return enabledModules.includes(module)
    },
    [isSuperAdmin, enabledModules]
  )

  const effectiveSections: NavSection[] = React.useMemo(() => {
    const rawSections =
      sections && sections.length > 0
        ? sections
        : items && items.length > 0
          ? [{ id: "default", items }]
          : []

    return rawSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const permOk = item.permission ? hasPermission(item.permission) : true
          const moduleOk = hasModuleAccess(item.module)
          return permOk && moduleOk
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, items, hasPermission, hasModuleAccess])

  return (
    <nav className="space-y-5">
      {effectiveSections.map((section, sectionIdx) => (
        <div
          key={section.id}
          className={cn(
            "space-y-1.5",
            sectionIdx > 0 && "border-t border-sidebar-border/50 pt-4"
          )}
        >
          {section.title && (
            <div className="flex items-center justify-between px-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <span className="truncate">{section.title}</span>
              {section.badge && (
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-600">
                  {section.badge}
                </span>
              )}
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === "/"
                  ? pathname === "/" || pathname === ""
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{t(item.key)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
