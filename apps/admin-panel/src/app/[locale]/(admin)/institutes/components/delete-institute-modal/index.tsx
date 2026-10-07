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
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <AlertDialogMedia className="mb-3 bg-destructive/10 text-destructive">
            <Trash2 className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-center text-lg font-bold sm:text-xl">
            {t("deleteModal.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("deleteModal.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

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

        <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-3 sm:grid sm:grid-cols-2 [&>*]:w-full">
          <AlertDialogCancel
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="w-full"
          >
            {t("deleteModal.cancel")}
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
