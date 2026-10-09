"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Counter } from "@workspace/ui/components/counter"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { useIsRtl } from "@/i18n/routing"
import { useGeneratePhaseTerms } from "../../generate/hooks/use-generate-phase-terms"

export interface GeneratePhaseTermsModalProps {
  open: boolean
  onClose: () => void
}

export function GeneratePhaseTermsModal({
  open,
  onClose,
}: GeneratePhaseTermsModalProps) {
  const t = useTranslations("terms")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const {
    phaseOptions,
    isLoadingPhases,
    setSelectedPhaseId,
    activePhaseId,
    isPhasePast,
    jalaliYear,
    setJalaliYear,
    sessionsPerTerm,
    setSessionsPerTerm,
    gapDays,
    setGapDays,
    previewQuery,
    isLoadingExisting,
    handleProceedToPreview,
  } = useGeneratePhaseTerms()

  const currentSessions = sessionsPerTerm ?? 15
  const [isProceeding, setIsProceeding] = React.useState(false)

  const handleProceed = async () => {
    setIsProceeding(true)
    try {
      await handleProceedToPreview()
    } finally {
      setIsProceeding(false)
    }
  }

  const isProceedDisabled =
    !activePhaseId || isProceeding || isLoadingExisting || isPhasePast

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("batchModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Phase Selection */}
            <Field>
              <FieldLabel>{t("batchModal.phaseLabel")}</FieldLabel>
              <ResponsiveCombobox
                items={phaseOptions}
                value={activePhaseId}
                onValueChange={(val) => setSelectedPhaseId(val || "")}
                placeholder={t("batchModal.phasePlaceholder")}
                drawerTitle={t("batchModal.phaseLabel")}
                emptyMessage={t("batchModal.emptyPhases")}
                clearable={false}
                disabled={isLoadingPhases}
              />
            </Field>

            {/* Academic Year */}
            <Field>
              <FieldLabel>{t("batchModal.jalaliYear")}</FieldLabel>
              <Counter
                min={1400}
                max={1500}
                value={jalaliYear}
                onValueChange={(val) => setJalaliYear(val || jalaliYear)}
                aria-label={t("batchModal.jalaliYear")}
                format={{ useGrouping: false }}
                className="w-full"
              />
            </Field>

            {/* Sessions Per Term and Gap Days (next to each other) */}
            <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:gap-5">
              <Field>
                <FieldLabel>{t("batchModal.sessionsPerTerm")}</FieldLabel>
                <Counter
                  min={1}
                  max={100}
                  value={currentSessions}
                  onValueChange={(val) => setSessionsPerTerm(val || 15)}
                  aria-label={t("batchModal.sessionsPerTerm")}
                  className="w-full"
                />
              </Field>

              <Field>
                <FieldLabel>{t("batchModal.gapDays")}</FieldLabel>
                <Counter
                  min={0}
                  max={30}
                  value={gapDays}
                  onValueChange={(val) => setGapDays(val ?? 0)}
                  aria-label={t("batchModal.gapDays")}
                  className="w-full"
                />
              </Field>
            </div>
          </div>

          {isPhasePast && (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <span className="leading-relaxed font-medium">
                {t("batchModal.pastMonthsNotAllowed")}
              </span>
            </div>
          )}
        </div>

        <FormDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("batchModal.cancel")}
          </Button>
          <Button
            type="button"
            disabled={isProceedDisabled}
            onClick={handleProceed}
          >
            {isProceeding ? (
              <Spinner className="size-5" />
            ) : (
              <ActionArrow className="size-5" />
            )}
            <span>
              {isProceeding
                ? t("batchModal.previewing")
                : t("batchModal.proceedToPreview")}
            </span>
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
