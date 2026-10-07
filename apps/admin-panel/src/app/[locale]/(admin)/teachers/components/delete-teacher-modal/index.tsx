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
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <AlertDialogMedia className="mb-3 bg-destructive/10 text-destructive">
            <Trash2 className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-center text-lg font-bold sm:text-xl">
            {t("deleteDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("deleteDialog.description", { name: fullName })}
          </AlertDialogDescription>
        </AlertDialogHeader>

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

        <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-3 sm:grid sm:grid-cols-2 [&>*]:w-full">
          <AlertDialogCancel
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="w-full"
          >
            {t("deleteDialog.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full"
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
