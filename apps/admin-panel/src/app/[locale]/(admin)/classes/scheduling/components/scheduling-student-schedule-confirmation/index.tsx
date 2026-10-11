"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { PERMISSIONS, type TermDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { formatDate } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { termsResource } from "@/lib/api"

export interface SchedulingStudentScheduleConfirmationProps {
  term: TermDto | null
  onConfirmed?: () => void
}

export function SchedulingStudentScheduleConfirmation({
  term,
  onConfirmed,
}: SchedulingStudentScheduleConfirmationProps) {
  const t = useTranslations("scheduling.generation.studentScheduleConfirmation")
  const locale = useLocale()
  const queryClient = useQueryClient()

  const confirmMutation = useMutation({
    ...termsResource.confirmStudentSchedules.toMutation(),
    onSuccess: () => {
      toast.success(t("confirmSuccess"))
      void queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      onConfirmed?.()
    },
  })

  if (!term) return null

  const isConfirmed = Boolean(term.studentSchedulesConfirmedAt)

  if (isConfirmed) {
    const confirmerName = term.studentSchedulesConfirmedByUser
      ? `${term.studentSchedulesConfirmedByUser.firstName} ${term.studentSchedulesConfirmedByUser.lastName}`.trim()
      : ""
    const dateFormatted = formatDate(term.studentSchedulesConfirmedAt, locale)

    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/5 p-4 text-foreground">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              {t("title")}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("confirmedDescription", {
                date: dateFormatted,
                user: confirmerName || "-",
              })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{t("title")}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("unconfirmedDescription")}
          </p>
        </div>
      </div>

      <PermissionGuard
        permission={PERMISSIONS.MANAGE_STUDENTS}
        mode="hide"
        className="shrink-0"
      >
        <Button
          type="button"
          onClick={() => confirmMutation.mutate(term.id)}
          disabled={confirmMutation.isPending}
          className="w-full sm:w-auto"
        >
          {confirmMutation.isPending ? (
            <Spinner className="size-4 text-primary-foreground" />
          ) : (
            <Clock data-icon="inline-start" className="size-4" />
          )}
          {t("confirmButton")}
        </Button>
      </PermissionGuard>
    </div>
  )
}
