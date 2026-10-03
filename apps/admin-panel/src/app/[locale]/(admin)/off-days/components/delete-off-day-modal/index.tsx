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
        <AlertDialogHeader className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-start">
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </AlertDialogMedia>
          <div className="flex flex-col gap-1">
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {offDay?.title
                ? t("deleteOffDayLabel", { title: offDay.title })
                : t("deleteDescription")}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
          <AlertDialogCancel
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="cursor-pointer"
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="cursor-pointer"
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
