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
import type { TermDto } from "@workspace/types"
import { termsResource } from "@/lib/api"

export interface DeleteTermModalProps {
  open: boolean
  onClose: () => void
  term: TermDto | null
}

export function DeleteTermModal({ open, onClose, term }: DeleteTermModalProps) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    ...termsResource.delete.toMutation(),
    onSuccess: () => {
      toast.success(t("deleteModal.success"))
      queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      onClose()
    },
  })

  const handleDelete = () => {
    if (!term) return
    deleteMutation.mutate(term.id)
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
            {t("deleteModal.description", { title: term?.title ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-3 sm:grid sm:grid-cols-2 [&>*]:w-full">
          <AlertDialogCancel
            className="w-full"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            {t("deleteModal.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            className="w-full"
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
