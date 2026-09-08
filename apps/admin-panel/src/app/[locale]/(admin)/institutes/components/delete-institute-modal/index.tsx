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
import type { InstituteWithStats } from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface DeleteInstituteModalProps {
  open: boolean
  onClose: () => void
  institute: InstituteWithStats | null
}

export function DeleteInstituteModal({
  open,
  onClose,
  institute,
}: DeleteInstituteModalProps) {
  const t = useTranslations("institutes")
  const queryClient = useQueryClient()
  const { activeInstitute, clearActiveInstitute } = useActiveInstitute()

  const deleteMutation = useMutation({
    ...institutesResource.delete.toMutation(),
    onSuccess: () => {
      toast.success(t("deleteModal.success"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.list.baseKey(),
      })
      if (activeInstitute?.id === institute?.id) {
        clearActiveInstitute()
      }
      onClose()
    },
  })

  const handleDelete = () => {
    if (!institute) return
    deleteMutation.mutate(institute.id)
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

        {institute && (
          <div className="mt-5 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">
                {t("deleteModal.instituteName")}
              </span>
              <strong className="text-foreground">{institute.name}</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">
                {t("deleteModal.subdomain")}
              </span>
              <span className="font-mono text-foreground" dir="ltr">
                {institute.subdomain}.kalameh.ir
              </span>
            </div>
          </div>
        )}

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="h-14 flex-1 rounded-2xl text-base font-medium sm:h-10 sm:w-auto sm:flex-initial sm:rounded-xl sm:px-4 sm:text-sm"
          >
            {t("deleteModal.cancel")}
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
