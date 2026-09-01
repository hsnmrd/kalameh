"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogCloseButton,
  ResponsiveDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
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
    <ResponsiveDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <ResponsiveDialogContent className="p-6 sm:max-w-md">
        <ResponsiveDialogHeader className="flex flex-row items-center justify-between">
          <ResponsiveDialogTitle>
            {t("deleteModal.title")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("deleteModal.description")}
          </p>
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

        <ResponsiveDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-initial"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            {t("deleteModal.cancel")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            className="flex-1 sm:flex-initial"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner className="size-4" />
                <span>{t("deleteModal.deleting")}</span>
              </>
            ) : (
              t("deleteModal.confirm")
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
