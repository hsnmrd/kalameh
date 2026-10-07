"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
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

export interface ResetRoleModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

export function ResetRoleModal({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: ResetRoleModalProps) {
  const t = useTranslations("rolePermissions")

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <AlertDialogMedia className="mb-3 bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-center text-lg font-bold sm:text-xl">
            {t("resetModal.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("resetModal.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-6 grid grid-cols-2 gap-3 sm:grid sm:grid-cols-2 [&>*]:w-full">
          <AlertDialogCancel
            className="w-full"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("resetModal.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            className="w-full"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner data-icon="inline-start" />
                <span>{t("resetting")}</span>
              </>
            ) : (
              t("resetModal.confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
