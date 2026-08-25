"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPopup className="max-w-md p-6">
        <DialogCloseButton />

        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>

          <div className="space-y-1">
            <DialogHeader className="text-start">
              <DialogTitle>{t("deleteModal.title")}</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                {t("deleteModal.description")}
              </DialogDescription>
            </DialogHeader>
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

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="h-10 rounded-xl px-4 text-xs font-semibold"
          >
            {t("deleteModal.cancel")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-10 rounded-xl px-5 text-xs font-semibold"
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
        </div>
      </DialogPopup>
    </Dialog>
  )
}
