"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Languages, Lock, LogOut, Menu } from "lucide-react"
import { ROLES, type AppModule } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { Separator } from "@workspace/ui/components/separator"
import { ThemeToggle } from "@workspace/ui/components/theme-toggle"
import { cn } from "@workspace/ui/lib/utils"
import { Link } from "@/i18n/routing"
import { usePermissions } from "@/lib/hooks"
import { useActiveInstitute } from "@/lib/stores"
import type { NavItem, NavItemKey, NavSection } from "../nav-list"

const DIRECT_ITEM_PRIORITY: NavItemKey[] = [
  "dashboard",
  "institutes",
  "classes",
  "students",
  "finance",
]

const MAX_DIRECT_ITEMS = 4

function isItemActive(item: NavItem, pathname: string) {
  return item.href === "/"
    ? pathname === "/" || pathname === ""
    : pathname.startsWith(item.href)
}

export interface MobileBottomNavigationProps {
  sections: NavSection[]
  pathname: string
  onLogout: () => void
  onSwitchLanguage: () => void
  locale: string
}

export function MobileBottomNavigation({
  sections,
  pathname,
  onLogout,
  onSwitchLanguage,
  locale,
}: MobileBottomNavigationProps) {
  const [open, setOpen] = React.useState(false)
  const t = useTranslations("common")
  const { hasPermission, user } = usePermissions()
  const { activeInstitute } = useActiveInstitute()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const enabledModules = React.useMemo(
    () => activeInstitute?.enabledModules ?? [],
    [activeInstitute?.enabledModules]
  )

  const hasModuleAccess = React.useCallback(
    (module?: AppModule) =>
      !module || isSuperAdmin || enabledModules.includes(module),
    [enabledModules, isSuperAdmin]
  )

  const permittedSections = React.useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            item.permission ? hasPermission(item.permission) : true
          ),
        }))
        .filter((section) => section.items.length > 0),
    [hasPermission, sections]
  )

  const directItems = React.useMemo(() => {
    const allItems = permittedSections.flatMap((section) => section.items)

    return DIRECT_ITEM_PRIORITY.flatMap((key) => {
      const item = allItems.find((candidate) => candidate.key === key)
      return item ? [item] : []
    }).slice(0, MAX_DIRECT_ITEMS)
  }, [permittedSections])

  const directItemKeys = React.useMemo(
    () => new Set(directItems.map((item) => item.key)),
    [directItems]
  )

  const overflowSections = React.useMemo(
    () =>
      permittedSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => !directItemKeys.has(item.key)),
        }))
        .filter((section) => section.items.length > 0),
    [directItemKeys, permittedSections]
  )

  const isMenuActive = overflowSections.some((section) =>
    section.items.some((item) => isItemActive(item, pathname))
  )

  return (
    <>
      <nav
        aria-label={t("nav.mobileNavigation")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom,0px)] shadow-lg backdrop-blur-md lg:hidden"
      >
        <div className="grid h-16 auto-cols-fr grid-flow-col items-stretch px-1">
          {directItems.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item, pathname)
            const isLocked = !hasModuleAccess(item.module)

            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] leading-3 font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  {isLocked && (
                    <Lock
                      className="absolute -end-2 -top-1 size-3 rounded-full bg-card text-current"
                      aria-label={t("nav.locked")}
                    />
                  )}
                </span>
                <span className="max-w-full truncate">
                  {t(`nav.${item.key}`)}
                </span>
                {isActive && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}

          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cn(
              "relative h-auto min-w-0 flex-col gap-1 rounded-xl px-1 py-1.5 text-[10px] leading-3 font-medium",
              isMenuActive
                ? "text-primary hover:text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Menu className="size-5" aria-hidden />
            <span className="max-w-full truncate">{t("nav.menu")}</span>
            {isMenuActive && (
              <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>
      </nav>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[90dvh] max-h-[90dvh] lg:hidden">
          <DrawerHeader className="border-b border-border px-5 pb-4">
            <DrawerTitle>{t("nav.moreTitle")}</DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
            {overflowSections.length > 0 ? (
              <div className="space-y-5">
                {overflowSections.map((section) => (
                  <section key={section.id} className="space-y-2">
                    {section.title && (
                      <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
                        <span className="truncate">{section.title}</span>
                        {section.badge && (
                          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {section.badge}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="grid gap-1 sm:grid-cols-2">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        const isActive = isItemActive(item, pathname)
                        const isLocked = !hasModuleAccess(item.module)

                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Icon className="size-4 shrink-0" aria-hidden />
                            <span className="truncate">
                              {t(`nav.${item.key}`)}
                            </span>
                            {isLocked && (
                              <Lock
                                className="ms-auto size-3.5 shrink-0 text-current opacity-70"
                                aria-label={t("nav.locked")}
                              />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {t("nav.noMoreLinks")}
              </p>
            )}
          </div>

          <Separator />

          <DrawerFooter className="gap-3 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <ThemeToggle
                showLabel
                labels={{
                  light: t("theme.light"),
                  dark: t("theme.dark"),
                  system: t("theme.system"),
                }}
                className="h-11 justify-center"
              />
              <Button
                type="button"
                variant="outline"
                onClick={onSwitchLanguage}
                className="h-11 gap-2"
                aria-label={t("language")}
              >
                <Languages className="size-4" aria-hidden />
                <span>{locale === "en" ? "فارسی" : "English"}</span>
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={onLogout}
              className="h-11 justify-start gap-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4 text-destructive" aria-hidden />
              <span>{t("logout")}</span>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
