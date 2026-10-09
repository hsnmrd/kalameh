"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Lock, LogOut, Menu } from "lucide-react"
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
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { Link } from "@/i18n/routing"
import { usePermissions, useNavTransition } from "@/lib/hooks"
import { useActiveInstitute } from "@/lib/stores"
import { useHeaderActions } from "../header-actions-context"
import type { MobileBottomNavigationProps } from "./types"
import {
  DIRECT_ITEM_PRIORITY,
  MAX_DIRECT_ITEMS,
  isItemActive,
  isInnerPage,
} from "./utils"

export type { MobileBottomNavigationProps } from "./types"
export { isInnerPage } from "./utils"

export function MobileBottomNavigation({
  sections,
  pathname,
  onLogout,
  focusedKey,
}: MobileBottomNavigationProps) {
  const [open, setOpen] = React.useState(false)
  const t = useTranslations("common")
  const { hasPermission, user } = usePermissions()
  const { activeInstitute } = useActiveInstitute()
  const { navigate, isHrefPending } = useNavTransition(pathname)
  const { backNavigation } = useHeaderActions()

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

  const isInner = isInnerPage(pathname) || Boolean(backNavigation)

  if (isInner) {
    return null
  }

  return (
    <>
      <span className="fixed inset-x-0 bottom-0 h-[50px] bg-gradient-to-t from-background" />
      <nav
        aria-label={t("nav.mobileNavigation")}
        className="fixed inset-x-4 bottom-3 z-40 rounded-[50px] border border-border bg-card/30 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
      >
        <div className="grid h-16 auto-cols-fr grid-flow-col items-stretch px-1">
          {directItems.map((item) => {
            const Icon = item.icon
            const isActive = isItemActive(item, pathname)
            const isLocked = !hasModuleAccess(item.module)
            const isPending = isHrefPending(item.href)
            const isFocused = Boolean(focusedKey && item.key === focusedKey)

            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={(e) => navigate(e, item.href)}
                aria-current={isActive ? "page" : undefined}
                aria-busy={isPending ? "true" : undefined}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] leading-3 font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isPending && "opacity-80"
                )}
              >
                <span className="relative">
                  {isPending ? (
                    <Spinner className="size-5 text-current" />
                  ) : (
                    <Icon className="size-5" aria-hidden />
                  )}
                  {isFocused && (
                    <span
                      data-testid="mobile-focus-badge"
                      aria-label={t("nav.focusHint")}
                      className="absolute -end-1 -top-1 flex size-2 items-center justify-center"
                    >
                      <span className="absolute size-2.5 animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative size-1.5 rounded-full bg-primary" />
                    </span>
                  )}
                  {isLocked && !isPending && (
                    <Lock
                      className="absolute -end-2 -top-1 size-3 rounded-full bg-card text-current"
                      aria-label={t("nav.locked")}
                    />
                  )}
                </span>
                <span className="max-w-full truncate">
                  {t(`navShort.${item.key}`)}
                </span>
                {isActive && (
                  <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}

          {(() => {
            const isMenuFocused = Boolean(
              focusedKey && !directItemKeys.has(focusedKey)
            )

            return (
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
                <span className="relative">
                  <Menu className="size-5" aria-hidden />
                  {isMenuFocused && (
                    <span
                      data-testid="mobile-menu-focus-badge"
                      aria-label={t("nav.focusHint")}
                      className="absolute -end-1 -top-1 flex size-2 items-center justify-center"
                    >
                      <span className="absolute size-2.5 animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative size-1.5 rounded-full bg-primary" />
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate">{t("nav.menu")}</span>
                {isMenuActive && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
                )}
              </Button>
            )
          })()}
        </div>
      </nav>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[90dvh] max-h-[90dvh] lg:hidden">
          <DrawerHeader className="border-b border-border px-5 pb-4">
            <DrawerTitle>{t("nav.moreTitle")}</DrawerTitle>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
            {overflowSections.length > 0 ? (
              <div className="flex flex-col gap-5">
                {overflowSections.map((section) => (
                  <section key={section.id} className="flex flex-col gap-2">
                    {section.contextTitle && (
                      <div className="flex items-center justify-between px-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        <span className="truncate">{section.contextTitle}</span>
                        {section.badge && (
                          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {section.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {section.title && (
                      <div className="flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
                        <span className="truncate">{section.title}</span>
                        {section.badge && !section.contextTitle && (
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
                        const isPending = isHrefPending(item.href)

                        const isFocused = Boolean(
                          focusedKey && item.key === focusedKey
                        )

                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={(e) =>
                              navigate(e, item.href, () => setOpen(false))
                            }
                            aria-current={isActive ? "page" : undefined}
                            aria-busy={isPending ? "true" : undefined}
                            className={cn(
                              "flex min-h-12 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              isPending && "opacity-80"
                            )}
                          >
                            {isPending ? (
                              <Spinner className="size-4 shrink-0 text-current" />
                            ) : (
                              <Icon className="size-4 shrink-0" aria-hidden />
                            )}
                            <span className="truncate">
                              {t(`nav.${item.key}`)}
                            </span>
                            {isFocused && (
                              <span
                                data-testid="mobile-drawer-focus-badge"
                                aria-label={t("nav.focusHint")}
                                title={t("nav.focusHint")}
                                className="relative flex size-2 shrink-0 items-center justify-center"
                              >
                                <span className="absolute size-2.5 animate-ping rounded-full bg-primary opacity-75" />
                                <span className="relative size-1.5 rounded-full bg-primary" />
                              </span>
                            )}
                            {isLocked && !isPending && (
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
            <Button
              type="button"
              variant="ghost"
              onClick={onLogout}
              className="h-14 w-full justify-start gap-3 rounded-2xl text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-5 text-destructive" aria-hidden />
              <span>{t("logout")}</span>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
