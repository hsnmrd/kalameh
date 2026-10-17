"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2 } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
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
import type { TermDto } from "@workspace/types"
import { termsResource } from "@/lib/api"

export interface FinalizeScoresModalProps {
  open: boolean
  onClose: () => void
  term: TermDto | null
  onSuccess?: () => void
}

export function FinalizeScoresModal({
  open,
  onClose,
  term,
  onSuccess,
}: FinalizeScoresModalProps) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()

  const finalizeMutation = useMutation({
    ...termsResource.finalizeScores.toMutation(),
    onSuccess: () => {
      toast.success(t("finalizeScoresModal.success"))
      queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: termsResource.detail.baseKey(),
      })
      onSuccess?.()
      onClose()
    },
  })

  const handleFinalize = () => {
    if (!term) return
    finalizeMutation.mutate(term.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <AlertDialogMedia className="mb-3 bg-amber-500/10 text-amber-500">
            <CheckCircle2 className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-center text-lg font-bold sm:text-xl">
            {t("finalizeScoresModal.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("finalizeScoresModal.description", { title: term?.title ?? "" })}
          </AlertDialogDescription>
          {Boolean(
            term?.unscoredStudentsCount && term.unscoredStudentsCount > 0
          ) && (
            <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              {t("finalizeScoresModal.unscoredWarning", {
                count: term?.unscoredStudentsCount ?? 0,
              })}
            </p>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-3 sm:grid sm:grid-cols-2 [&>*]:w-full">
          <AlertDialogCancel
            className="w-full"
            onClick={onClose}
            disabled={finalizeMutation.isPending}
          >
            {t("finalizeScoresModal.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            className="w-full"
            onClick={handleFinalize}
            disabled={finalizeMutation.isPending}
          >
            {finalizeMutation.isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                <span>{t("finalizeScoresModal.confirm")}</span>
              </>
            ) : (
              t("finalizeScoresModal.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
