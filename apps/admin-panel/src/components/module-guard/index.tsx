"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Lock, PhoneCall } from "lucide-react"
import { type AppModule, ROLES } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
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
      <Empty className={className}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Lock className="size-7" />
          </EmptyMedia>
          <EmptyTitle>{displayTitle}</EmptyTitle>
          <EmptyDescription>{displayDescription}</EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer gap-2 rounded-xl text-xs font-semibold"
            onClick={() => toast.info(t("contactSalesToast"))}
          >
            <PhoneCall className="size-3.5 text-muted-foreground" />
            <span>{t("contactSalesCta")}</span>
          </Button>
        </EmptyContent>
      </Empty>
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
