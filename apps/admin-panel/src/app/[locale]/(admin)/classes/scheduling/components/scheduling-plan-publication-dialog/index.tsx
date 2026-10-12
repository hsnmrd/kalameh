"use client"

import { useLocale, useTranslations } from "next-intl"
import { CalendarCheck2 } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingPlanPublicationDialogProps {
  open: boolean
  plan: SchedulingPlanDetailsDto
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}

export function SchedulingPlanPublicationDialog({
  open,
  plan,
  isPending,
  onClose,
  onConfirm,
}: SchedulingPlanPublicationDialogProps) {
  const t = useTranslations("scheduling.planPublication")
  const locale = useLocale()
  const proposalCount = formatNumber(plan.proposals.length, locale)

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && !isPending && onClose()}
    >
      <ResponsiveDialogContent
        role="alertdialog"
        className="overflow-hidden p-0 sm:max-w-md"
      >
        <ResponsiveDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <ResponsiveDialogTitle>
            {t("confirmation.title")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton disabled={isPending} />
        </ResponsiveDialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3.5">
            <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarCheck2 aria-hidden className="size-5 text-primary" />
            </div>
            <p className="text-xs leading-6 text-muted-foreground">
              {t("confirmation.description", { count: proposalCount })}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                {t("confirmation.term")}
              </span>
              <strong className="text-foreground">{plan.run.term.title}</strong>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                {t("confirmation.classes")}
              </span>
              <strong className="text-foreground">{proposalCount}</strong>
            </div>
          </div>

          <p className="text-xs leading-6 text-muted-foreground">
            {t("confirmation.consequence")}
          </p>
        </div>

        <ResponsiveDialogFooter className="flex-row items-center gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 sm:justify-end sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="min-w-0 flex-1 sm:flex-initial"
          >
            {t("confirmation.cancel")}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="min-w-0 flex-1 sm:flex-initial"
          >
            {isPending && <Spinner data-icon="inline-start" />}
            <span className="truncate">
              {isPending
                ? t("confirmation.publishing")
                : t("confirmation.confirm", { count: proposalCount })}
            </span>
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
