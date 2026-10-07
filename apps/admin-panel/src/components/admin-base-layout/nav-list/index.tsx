"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Lock } from "lucide-react"
import type { Permission, AppModule } from "@workspace/types"
import { ROLES } from "@workspace/types"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import { Link } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import { usePermissions, useNavTransition } from "@/lib/hooks"
import { useActiveInstitute } from "@/lib/stores"

export type NavItemKey =
  | "dashboard"
  | "platformDashboard"
  | "instituteDashboard"
  | "institutes"
  | "classes"
  | "scheduling"
  | "classrooms"
  | "branches"
  | "terms"
  | "courses"
  | "teachers"
  | "students"
  | "staff"
  | "rolePermissions"
  | "finance"
  | "operatingPhases"
  | "offDays"
  | "calendar"

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
  contextTitle?: string
  badge?: string
  items: NavItem[]
}

export interface NavListProps {
  sections?: NavSection[]
  items?: NavItem[]
  pathname: string
  onItemClick?: () => void
  focusedKey?: NavItemKey | null
}

export function NavList({
  sections,
  items,
  pathname,
  onItemClick,
  focusedKey,
}: NavListProps) {
  const t = useTranslations("common.nav")
  const { hasPermission, user } = usePermissions()
  const { activeInstitute } = useActiveInstitute()
  const { navigate, isHrefPending } = useNavTransition(pathname)

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const enabledModules = React.useMemo(
    () => activeInstitute?.enabledModules ?? [],
    [activeInstitute?.enabledModules]
  )

  const isItemActive = React.useCallback(
    (item: NavItem) =>
      item.href === "/"
        ? pathname === "/" || pathname === ""
        : pathname.startsWith(item.href),
    [pathname]
  )

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
          // Keep all permitted items visible in navigation so locked modules can be discovered with a lock icon
          return permOk
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, items, hasPermission])

  return (
    <nav className="flex flex-col gap-3">
      {effectiveSections.map((section, sectionIdx) => (
        <React.Fragment key={section.id}>
          {sectionIdx > 0 && <Separator className="bg-sidebar-border/50" />}
          <div className="flex flex-col gap-1.5">
            {section.contextTitle && (
              <div className="flex items-center justify-between px-3 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <span className="truncate">{section.contextTitle}</span>
                {section.badge && (
                  <span className="rounded-md bg-success/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-success">
                    {section.badge}
                  </span>
                )}
              </div>
            )}

            {section.title && (
              <div className="flex min-h-8 items-center gap-2 px-3 text-xs font-semibold text-muted-foreground">
                <span className="truncate">{section.title}</span>
                {section.badge && !section.contextTitle && (
                  <span className="ms-auto rounded-md bg-success/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-success">
                    {section.badge}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isLocked = !hasModuleAccess(item.module)
                const isActive = isItemActive(item)
                const isPending = isHrefPending(item.href)
                const isFocused = Boolean(focusedKey && item.key === focusedKey)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => navigate(e, item.href, onItemClick)}
                    aria-current={isActive ? "page" : undefined}
                    aria-busy={isPending ? "true" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 font-semibold text-primary"
                        : isLocked
                          ? "text-muted-foreground/80 hover:bg-muted hover:text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      isPending && "opacity-80"
                    )}
                  >
                    {isPending ? (
                      <Spinner className="size-4 shrink-0 text-current" />
                    ) : (
                      <Icon className="size-4 shrink-0" />
                    )}
                    <span className="truncate">{t(item.key)}</span>
                    {isFocused && (
                      <span
                        data-testid="nav-focus-badge"
                        aria-label={t("focusHint")}
                        title={t("focusHint")}
                        className="relative flex size-2 shrink-0 items-center justify-center"
                      >
                        <span className="absolute size-2.5 animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative size-1.5 rounded-full bg-primary" />
                      </span>
                    )}
                    {isLocked && !isPending && (
                      <Lock
                        aria-label={t("locked")}
                        className={cn(
                          "ms-auto size-3.5 shrink-0 transition-colors",
                          isActive
                            ? "text-primary opacity-80"
                            : "text-muted-foreground opacity-70 group-hover:text-foreground group-hover:opacity-100"
                        )}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </React.Fragment>
      ))}
    </nav>
  )
}
