"use client"

import * as React from "react"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
} from "@workspace/ui/components/dialog"
import { StepConfiguration } from "./step-configuration"
import { StepPreview } from "./step-preview"
import { ModalFooter } from "./modal-footer"
import { useGeneratePhaseTerms } from "./hooks/use-generate-phase-terms"

export interface GeneratePhaseTermsModalProps {
  open: boolean
  onClose: () => void
}

export function GeneratePhaseTermsModal({
  open,
  onClose,
}: GeneratePhaseTermsModalProps) {
  const {
    t,
    step,
    setStep,
    viewMode,
    setViewMode,
    setSelectedPhaseId,
    activePhaseId,
    jalaliYear,
    setJalaliYear,
    sessionsPerTerm,
    setSessionsPerTerm,
    daysPerTerm,
    setDaysPerTerm,
    activeClassPatterns,
    gapDays,
    setGapDays,
    proposals,
    setProposals,
    hasAnySessionImbalance,
    phaseOptions,
    previewQuery,
    batchCreateMutation,
    isLoadingExisting,
    observeOfficialHolidays,
    customOffDays,
    activeDismissedHolidays,
    compensatorySessions,
    handleProceedToPreview,
    handleTitleChange,
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
    handleAddCompensatorySession,
    handleRemoveCompensatorySession,
    handleSubmit,
    handleOpenChange,
  } = useGeneratePhaseTerms({ open, onClose })

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-4xl">
        <FormDialogHeader>
          <div className="flex items-center justify-between gap-3 pe-8">
            <FormDialogTitle>
              {step === 1 ? t("batchModal.title") : t("batchModal.step2Title")}
            </FormDialogTitle>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {step === 1 && (
              <StepConfiguration
                phaseOptions={phaseOptions}
                activePhaseId={activePhaseId}
                onPhaseChange={(id) => {
                  setSelectedPhaseId(id)
                  setProposals([])
                }}
                jalaliYear={jalaliYear}
                onJalaliYearChange={setJalaliYear}
                sessionsPerTerm={sessionsPerTerm}
                onSessionsPerTermChange={setSessionsPerTerm}
                daysPerTerm={daysPerTerm}
                onDaysPerTermChange={setDaysPerTerm}
                gapDays={gapDays}
                onGapDaysChange={setGapDays}
              />
            )}

            {step === 2 && (
              <StepPreview
                proposals={proposals}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onTitleChange={handleTitleChange}
                onStartDateChange={handleStartDateChange}
                onToggleHoliday={handleToggleHoliday}
                onToggleCustomOffDay={handleToggleCustomOffDay}
                onAddCompensatorySession={handleAddCompensatorySession}
                onRemoveCompensatorySession={handleRemoveCompensatorySession}
                observeOfficialHolidays={observeOfficialHolidays}
                customOffDays={customOffDays}
                activeDismissedHolidays={activeDismissedHolidays}
                compensatorySessions={compensatorySessions}
              />
            )}
          </div>

          <ModalFooter
            step={step}
            onClose={onClose}
            onBack={() => setStep(1)}
            onProceed={handleProceedToPreview}
            onSubmit={handleSubmit}
            isProceedDisabled={
              !activePhaseId || previewQuery.isFetching || isLoadingExisting
            }
            isProceedLoading={previewQuery.isFetching || isLoadingExisting}
            isSubmitDisabled={
              proposals.length === 0 ||
              batchCreateMutation.isPending ||
              hasAnySessionImbalance
            }
            isSubmitLoading={batchCreateMutation.isPending}
          />
        </div>
      </FormDialogContent>
    </FormDialog>
  )
}
