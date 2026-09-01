"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
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
    <ResponsiveDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <ResponsiveDialogContent className="p-6 sm:max-w-md">
        <ResponsiveDialogHeader className="flex flex-row items-center justify-between">
          <ResponsiveDialogTitle>{t("resetModal.title")}</ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("resetModal.description")}
          </p>
        </div>

        <ResponsiveDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-initial"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("resetModal.cancel")}
          </Button>

          <Button
            type="button"
            variant="destructive"
            className="flex-1 sm:flex-initial"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="size-4" />
                <span>{t("resetting")}</span>
              </>
            ) : (
              t("resetModal.confirm")
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
