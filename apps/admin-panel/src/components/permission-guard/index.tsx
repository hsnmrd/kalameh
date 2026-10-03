"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type { Permission } from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { usePermissions } from "@/lib/hooks"
import { ForbiddenState } from "../forbidden-state"

export type PermissionGuardMode = "disable" | "hide" | "forbidden"

export interface PermissionGuardProps {
  permission: Permission | readonly Permission[]
  mode?: PermissionGuardMode
  requireAll?: boolean
  toastMessage?: string
  fallback?: React.ReactNode
  forbiddenTitle?: string
  forbiddenDescription?: string
  className?: string
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  mode = "disable",
  requireAll = false,
  toastMessage,
  fallback = null,
  forbiddenTitle,
  forbiddenDescription,
  className,
  children,
}: PermissionGuardProps) {
  const t = useTranslations("common")
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) {
    if (mode === "forbidden") {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-8 text-primary" />
        </div>
      )
    }
    if (mode === "hide") {
      return null
    }
  }

  const hasAccess = hasPermission(permission, requireAll)

  if (hasAccess) {
    return <>{children}</>
  }

  if (mode === "hide") {
    return fallback ? <>{fallback}</> : null
  }

  if (mode === "forbidden") {
    return (
      <ForbiddenState
        title={forbiddenTitle}
        description={forbiddenDescription}
        className={className}
      />
    )
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toast.error(toastMessage || t("noPermission"))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      e.stopPropagation()
      toast.error(toastMessage || t("noPermission"))
    }
  }

  return (
    <span
      aria-disabled="true"
      className={cn(
        "inline-flex cursor-not-allowed opacity-60 transition-opacity select-none",
        className
      )}
      onClickCapture={handleClickCapture}
      onKeyDown={handleKeyDown}
    >
      <span className="pointer-events-none inline-flex w-full items-center justify-center">
        {children}
      </span>
    </span>
  )
}
