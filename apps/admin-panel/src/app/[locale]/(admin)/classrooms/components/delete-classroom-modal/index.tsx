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
import type { ClassroomDto } from "@workspace/types"
import { classroomsResource } from "@/lib/api"

export interface DeleteClassroomModalProps {
  open: boolean
  onClose: () => void
  classroom: ClassroomDto | null
}

export function DeleteClassroomModal({
  open,
  onClose,
  classroom,
}: DeleteClassroomModalProps) {
  const t = useTranslations("classrooms")
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    ...classroomsResource.delete.toMutation(),
    onSuccess: () => {
      toast.success(t("deleteModal.success"))
      queryClient.invalidateQueries({
        queryKey: classroomsResource.list.baseKey(),
      })
      onClose()
    },
  })

  const handleDelete = () => {
    if (!classroom) return
    deleteMutation.mutate(classroom.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteModal.title")}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {t("deleteModal.description")}
          </AlertDialogDescription>
        </div>

        {classroom && (
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/40 p-3.5">
            <p className="text-xs text-muted-foreground">
              {t("deleteModal.classroomName")}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {classroom.name}
            </p>
          </div>
        )}

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel
            className="flex-1 sm:w-auto sm:flex-initial"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            {t("deleteModal.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            className="flex-1 sm:w-auto sm:flex-initial"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                <span>{t("deleteModal.deleting")}</span>
              </>
            ) : (
              t("deleteModal.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
