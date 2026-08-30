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

        <ResponsiveDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="h-14 flex-1 rounded-2xl text-base font-medium sm:h-10 sm:w-auto sm:flex-initial sm:rounded-xl sm:px-4 sm:text-sm"
          >
            {t("deleteModal.cancel")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-14 flex-1 rounded-2xl text-base font-medium sm:h-10 sm:w-auto sm:flex-initial sm:rounded-xl sm:px-5 sm:text-sm"
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner className="text-destructive-foreground me-2 size-5" />
                {t("deleteModal.deleting")}
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
