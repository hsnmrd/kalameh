"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import type { ClassRequirementDto } from "@workspace/types"
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

export interface DeleteRequirementModalProps {
  open: boolean
  onClose: () => void
  item: ClassRequirementDto | null
  onConfirm: (id: string) => void
  isDeleting?: boolean
}

export function DeleteRequirementModal({
  open,
  onClose,
  item,
  onConfirm,
  isDeleting,
}: DeleteRequirementModalProps) {
  const t = useTranslations("scheduling")

  if (!item) return null

  const handleDelete = () => {
    onConfirm(item.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("requirementsPage.deleteRequirement")}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {t("requirementsPage.deleteConfirm")}
          </AlertDialogDescription>
        </div>

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel
            className="flex-1 sm:w-auto sm:flex-initial"
            onClick={onClose}
            disabled={isDeleting}
          >
            {t("requirementsPage.actions.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            className="flex-1 sm:w-auto sm:flex-initial"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner data-icon="inline-start" />
                <span>{t("requirementsPage.actions.delete")}</span>
              </>
            ) : (
              t("requirementsPage.actions.delete")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
