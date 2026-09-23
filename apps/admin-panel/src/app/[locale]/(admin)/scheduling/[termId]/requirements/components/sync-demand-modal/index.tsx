"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"
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

export interface SyncDemandModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isSyncing?: boolean
}

export function SyncDemandModal({
  open,
  onClose,
  onConfirm,
  isSyncing,
}: SyncDemandModalProps) {
  const t = useTranslations("scheduling")

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("requirementsPage.syncDemand")}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-primary/10 text-primary">
            <Sparkles />
          </AlertDialogMedia>
          <AlertDialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {t("requirementsPage.syncDemandDesc")}
          </AlertDialogDescription>
        </div>

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:justify-end sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel
            className="flex-1 sm:w-auto sm:flex-initial"
            onClick={onClose}
            disabled={isSyncing}
          >
            {t("requirementsPage.actions.cancel")}
          </AlertDialogCancel>

          <AlertDialogAction
            className="flex-1 sm:w-auto sm:flex-initial"
            onClick={onConfirm}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Spinner data-icon="inline-start" />
                <span>{t("demand.applying")}</span>
              </>
            ) : (
              t("requirementsPage.syncDemandConfirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
