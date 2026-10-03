"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Wand2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { FormDialogFooter } from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"

export interface ModalFooterProps {
  step: 1 | 2
  onClose: () => void
  onBack: () => void
  onProceed: () => void
  onSubmit: () => void
  isProceedDisabled: boolean
  isProceedLoading: boolean
  isSubmitDisabled: boolean
  isSubmitLoading: boolean
}

export function ModalFooter({
  step,
  onClose,
  onBack,
  onProceed,
  onSubmit,
  isProceedDisabled,
  isProceedLoading,
  isSubmitDisabled,
  isSubmitLoading,
}: ModalFooterProps) {
  const t = useTranslations("terms")

  return (
    <FormDialogFooter>
      {step === 1 ? (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
          >
            {t("batchModal.cancel")}
          </Button>
          <Button
            type="button"
            disabled={isProceedDisabled}
            onClick={onProceed}
            className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            {isProceedLoading ? (
              <Spinner className="me-2 size-5 text-primary-foreground" />
            ) : (
              <Wand2 className="me-2 size-5 text-primary-foreground" />
            )}
            {isProceedLoading
              ? t("batchModal.previewing")
              : t("batchModal.proceedToPreview")}
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitLoading}
            onClick={onBack}
            className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
          >
            {t("batchModal.backToSettings")}
          </Button>
          <Button
            type="button"
            disabled={isSubmitDisabled}
            onClick={onSubmit}
            className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitLoading && (
              <Spinner className="me-2 size-5 text-primary-foreground" />
            )}
            {t("batchModal.submit")}
          </Button>
        </>
      )}
    </FormDialogFooter>
  )
}
