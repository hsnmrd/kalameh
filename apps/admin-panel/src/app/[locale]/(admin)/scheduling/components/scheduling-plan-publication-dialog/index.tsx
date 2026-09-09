"use client"

import { useLocale, useTranslations } from "next-intl"
import { CalendarCheck2 } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
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
    <AlertDialog
      open={open}
      onOpenChange={(next) => !next && !isPending && onClose()}
    >
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmation.title")}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-primary/10 text-primary">
            <CalendarCheck2 />
          </AlertDialogMedia>
          <AlertDialogDescription>
            {t("confirmation.description", { count: proposalCount })}
          </AlertDialogDescription>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-muted/40 p-3.5 text-sm">
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

        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          {t("confirmation.consequence")}
        </p>

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel disabled={isPending} onClick={onClose}>
            {t("confirmation.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={onConfirm}>
            {isPending && <Spinner data-icon="inline-start" />}
            {isPending
              ? t("confirmation.publishing")
              : t("confirmation.confirm", { count: proposalCount })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
