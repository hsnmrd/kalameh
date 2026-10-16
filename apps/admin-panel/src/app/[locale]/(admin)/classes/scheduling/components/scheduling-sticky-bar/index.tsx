"use client"

import { useTranslations } from "next-intl"
import { CalendarPlus } from "lucide-react"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { PermissionGuard } from "@/components/permission-guard"

export interface SchedulingStickyBarProps {
  termId?: string
  onGenerateSchedule?: () => void
  disabled?: boolean
  disabledReason?: string
  isGenerating?: boolean
}

export function SchedulingStickyBar({
  onGenerateSchedule,
  disabled = false,
  disabledReason,
  isGenerating = false,
}: SchedulingStickyBarProps) {
  const t = useTranslations("scheduling")
  if (!onGenerateSchedule) return null

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-lg backdrop-blur-md sm:hidden">
        <span
          onClickCapture={
            disabled && disabledReason
              ? (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toast.error(disabledReason)
                }
              : undefined
          }
          className={
            disabled ? "block w-full cursor-not-allowed" : "block w-full"
          }
        >
          <Button
            type="button"
            disabled={disabled || isGenerating}
            onClick={onGenerateSchedule}
            className="h-14 w-full cursor-pointer gap-2 rounded-2xl text-base font-semibold shadow-xs"
          >
            {isGenerating ? (
              <Spinner className="size-5 text-primary-foreground" />
            ) : (
              <CalendarPlus
                className="size-5 text-primary-foreground"
                aria-hidden
              />
            )}
            <span>{t("demand.applyAndContinue")}</span>
          </Button>
        </span>
      </div>
    </PermissionGuard>
  )
}
