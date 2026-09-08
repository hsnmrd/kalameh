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
import type { TeacherDto } from "@workspace/types"
import { teachersResource } from "@/lib/api"

export interface DeleteTeacherModalProps {
  open: boolean
  onClose: () => void
  teacher: TeacherDto | null
}

export function DeleteTeacherModal({
  open,
  onClose,
  teacher,
}: DeleteTeacherModalProps) {
  const t = useTranslations("teachers")
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    ...teachersResource.delete.toMutation(),
    onSuccess: () => {
      toast.success(t("deleteDialog.success"))
      queryClient.invalidateQueries({
        queryKey: teachersResource.list.baseKey(),
      })
      onClose()
    },
  })

  const handleDelete = () => {
    if (!teacher) return
    deleteMutation.mutate(teacher.id)
  }

  const fullName = teacher ? `${teacher.firstName} ${teacher.lastName}` : ""

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {t("deleteDialog.description", { name: fullName })}
          </AlertDialogDescription>
        </div>

        {teacher && (
          <div className="mt-5 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">{t("table.name")}</span>
              <strong className="text-foreground">{fullName}</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">{t("table.phone")}</span>
              <span className="font-mono text-foreground" dir="ltr">
                {teacher.phone}
              </span>
            </div>
            {teacher.nationalCode && (
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">
                  {t("table.nationalCode")}
                </span>
                <span className="font-mono text-foreground" dir="ltr">
                  {teacher.nationalCode}
                </span>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="h-14 flex-1 rounded-2xl text-base font-medium sm:h-10 sm:w-auto sm:flex-initial sm:rounded-xl sm:px-4 sm:text-sm"
          >
            {t("deleteDialog.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-14 flex-1 rounded-2xl text-base font-medium sm:h-10 sm:w-auto sm:flex-initial sm:rounded-xl sm:px-5 sm:text-sm"
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner data-icon="inline-start" />
                <span>{t("deleteDialog.confirm")}</span>
              </>
            ) : (
              t("deleteDialog.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
