"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { PermissionGuard } from "@/components/permission-guard"
import type { SchedulingTab } from "../scheduling-filter"

export interface SchedulingFabProps {
  activeTab: SchedulingTab
  termId: string
  hasDemands?: boolean
  onCalculateDemand?: () => void
  onApplyDemand?: () => void
  registeredCount?: number
}

export function SchedulingFab({ activeTab, termId }: SchedulingFabProps) {
  const t = useTranslations("scheduling")
  const locale = useLocale()
  const router = useRouter()

  if (activeTab !== "demand" || !termId) {
    return null
  }

  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="hide">
      <FABSingle
        onClick={() =>
          router.push(`/${locale}/scheduling/${termId}/requirements`)
        }
        aria-label={t("demand.manageRequirementsButton")}
      >
        <Pencil className="size-6" aria-hidden />
      </FABSingle>
    </PermissionGuard>
  )
}
