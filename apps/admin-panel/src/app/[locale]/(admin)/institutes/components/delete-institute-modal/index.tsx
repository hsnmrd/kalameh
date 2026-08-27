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
  ResponsiveDialogDescription,
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
      <ResponsiveDialogContent className="max-w-md p-6">
        <ResponsiveDialogCloseButton />

        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>

          <div className="space-y-1">
            <ResponsiveDialogHeader className="text-start">
              <ResponsiveDialogTitle>
                {t("deleteModal.title")}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="text-xs leading-relaxed">
                {t("deleteModal.description")}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
          </div>
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

        <ResponsiveDialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 sm:border-t sm:border-border/60 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="h-11 w-full rounded-xl text-xs font-semibold sm:h-10 sm:w-auto sm:px-4"
          >
            {t("deleteModal.cancel")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-11 w-full rounded-xl text-xs font-semibold sm:h-10 sm:w-auto sm:px-5"
          >
            {deleteMutation.isPending ? (
              <>
                <Spinner className="text-destructive-foreground me-2 size-4" />
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
