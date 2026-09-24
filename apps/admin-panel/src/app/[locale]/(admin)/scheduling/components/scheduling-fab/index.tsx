"use client"

import { useTranslations } from "next-intl"
import { CalendarPlus } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { PermissionGuard } from "@/components/permission-guard"

export interface SchedulingFabProps {
  termId?: string
  onGenerateSchedule?: () => void
  disabled?: boolean
}

export function SchedulingFab({
  onGenerateSchedule,
  disabled,
}: SchedulingFabProps) {
  const t = useTranslations("scheduling")
  if (!onGenerateSchedule || disabled) return null

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
      <FABSingle
        onClick={onGenerateSchedule}
        aria-label={t("demand.applyAndContinue")}
      >
        <CalendarPlus className="size-6" aria-hidden />
      </FABSingle>
    </PermissionGuard>
  )
}
