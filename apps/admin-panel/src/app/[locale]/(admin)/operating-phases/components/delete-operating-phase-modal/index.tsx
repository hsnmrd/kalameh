"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
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
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <AlertDialogMedia className="mb-3 bg-destructive/10 text-destructive">
            <Trash2 className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-center text-lg font-bold sm:text-xl">
            {t("deletePhase")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("deleteDescription", { title: phase?.title || "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-3 sm:grid sm:grid-cols-2 [&>*]:w-full">
          <AlertDialogCancel
            disabled={deleteMutation.isPending}
            className="w-full"
          >
            {t("form.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full"
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
