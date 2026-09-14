"use client"

import { useTranslations } from "next-intl"
import { Check, RotateCcw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

export interface CalendarMobileActionsProps {
  isPending: boolean
  onReset: () => void
  onSave: () => void
}

export function CalendarMobileActions({
  isPending,
  onReset,
  onSave,
}: CalendarMobileActionsProps) {
  const t = useTranslations("setting.offDays")

  return (
    <div
      role="group"
      aria-label={t("calendarActionsLabel")}
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 flex items-center gap-3 border-t border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-md lg:hidden"
    >
      <Button
        type="button"
        variant="outline"
        onClick={onReset}
        disabled={isPending}
        className="h-14 min-w-0 flex-1 cursor-pointer rounded-2xl px-4 text-base font-medium"
      >
        <RotateCcw data-icon="inline-start" />
        <span>{t("discardChanges")}</span>
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="h-14 min-w-0 flex-1 cursor-pointer rounded-2xl px-4 text-base font-medium shadow-xs"
      >
        {isPending ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <Check data-icon="inline-start" />
        )}
        <span>{t("saveChanges")}</span>
      </Button>
    </div>
  )
}
