"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
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
import type { OperatingPhaseWithSlots } from "@workspace/types"
import { operatingPhasesResource } from "@/lib/api"

export interface DeleteOperatingPhaseModalProps {
  open: boolean
  onClose: () => void
  phase: OperatingPhaseWithSlots | null
}

export function DeleteOperatingPhaseModal({
  open,
  onClose,
  phase,
}: DeleteOperatingPhaseModalProps) {
  const t = useTranslations("operating-phases")
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    ...operatingPhasesResource.delete.toMutation(),
    onSuccess: () => {
      toast.success(t("notifications.deleted"))
      queryClient.invalidateQueries({
        queryKey: operatingPhasesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const handleDelete = () => {
    if (!phase) return
    deleteMutation.mutate(phase.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deletePhase")}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </AlertDialogMedia>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {t("deleteDescription", { title: phase?.title || "" })}
          </AlertDialogDescription>
        </div>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t("form.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <span>{t("deletePhase")}</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
