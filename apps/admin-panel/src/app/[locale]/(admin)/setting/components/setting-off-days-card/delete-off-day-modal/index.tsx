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
import type { InstituteCustomOffDay } from "@workspace/types"
import { institutesResource } from "@/lib/api"

export interface DeleteOffDayModalProps {
  open: boolean
  onClose: () => void
  offDay: InstituteCustomOffDay | null
  instituteId: string
}

export function DeleteOffDayModal({
  open,
  onClose,
  offDay,
  instituteId,
}: DeleteOffDayModalProps) {
  const t = useTranslations("setting.offDays")
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    ...institutesResource.deleteCustomOffDay.toMutation(),
    onSuccess: () => {
      toast.success(t("successDeleteOffDay"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      })
      onClose()
    },
  })

  const handleDelete = () => {
    if (!offDay || !instituteId) return
    deleteMutation.mutate({
      id: instituteId,
      offDayId: offDay.id,
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </AlertDialogMedia>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {t("deleteDescription")}
          </AlertDialogDescription>
        </div>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <span>{t("confirmDelete")}</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
