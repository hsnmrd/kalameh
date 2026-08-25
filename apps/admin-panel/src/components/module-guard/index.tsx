"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Lock, PhoneCall } from "lucide-react"
import { type AppModule, ROLES } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"
import { usePermissions } from "@/lib/hooks"
import { useActiveInstitute } from "@/lib/stores"

export type ModuleGuardMode = "hide" | "disable" | "upgrade"

export interface ModuleGuardProps {
  module: AppModule | readonly AppModule[]
  mode?: ModuleGuardMode
  requireAll?: boolean
  fallback?: React.ReactNode
  upgradeTitle?: string
  upgradeDescription?: string
  className?: string
  children: React.ReactNode
}

export function ModuleGuard({
  module,
  mode = "upgrade",
  requireAll = false,
  fallback = null,
  upgradeTitle,
  upgradeDescription,
  className,
  children,
}: ModuleGuardProps) {
  const t = useTranslations("common.modules")
  const { user } = usePermissions()
  const { activeInstitute } = useActiveInstitute()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const enabledModules = activeInstitute?.enabledModules || []

  const modulesToCheck = Array.isArray(module) ? module : [module]

  const hasAccess =
    isSuperAdmin ||
    (requireAll
      ? modulesToCheck.every((m) => enabledModules.includes(m))
      : modulesToCheck.some((m) => enabledModules.includes(m)))

  if (hasAccess) {
    return <>{children}</>
  }

  if (mode === "hide") {
    return fallback ? <>{fallback}</> : null
  }

  if (mode === "upgrade") {
    const singleModule = modulesToCheck.length === 1 ? modulesToCheck[0] : null
    const displayTitle =
      upgradeTitle ||
      (singleModule ? t(`items.${singleModule}.name`) : t("title"))
    const displayDescription =
      upgradeDescription ||
      (singleModule ? t(`items.${singleModule}.description`) : t("description"))

    return (
      <div
        className={cn(
          "flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center text-card-foreground shadow-2xs",
          className
        )}
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="size-7" />
        </div>

        <h3 className="mt-4 text-base font-bold text-foreground">
          {displayTitle}
        </h3>

        <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          {displayDescription}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer gap-2 rounded-xl text-xs font-semibold"
            onClick={() => toast.info(t("contactSalesToast"))}
          >
            <PhoneCall className="size-3.5 text-muted-foreground" />
            <span>{t("contactSalesCta")}</span>
          </Button>
        </div>
      </div>
    )
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toast.error(t("inactiveToast"))
  }

  return (
    <span
      aria-disabled="true"
      className={cn(
        "inline-flex cursor-not-allowed opacity-60 transition-opacity select-none",
        className
      )}
      onClickCapture={handleClickCapture}
    >
      <span className="pointer-events-none inline-flex w-full items-center justify-center">
        {children}
      </span>
    </span>
  )
}
