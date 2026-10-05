"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { useGeneratePhaseTerms } from "../../hooks/use-generate-phase-terms"
import { StepConfiguration } from "../step-configuration"
import { StepPreview } from "../step-preview"

export function GeneratePhaseTermsContent() {
  const t = useTranslations("terms")
  const tCommon = useTranslations("common")

  const {
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
    handleCancel,
  } = useGeneratePhaseTerms()

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref="/terms"
              backLabel={tCommon("nav.terms")}
              items={
                step === 1
                  ? [
                      { label: tCommon("nav.terms"), href: "/terms" },
                      { label: t("batchModal.title") },
                    ]
                  : [
                      { label: tCommon("nav.terms"), href: "/terms" },
                      { label: t("batchModal.title"), href: "/terms/generate" },
                      { label: t("batchModal.step2Title") },
                    ]
              }
            />
          }
        >
          <div className="flex flex-col gap-6">
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
                onCancel={handleCancel}
                onProceed={handleProceedToPreview}
                isProceedDisabled={
                  !activePhaseId || previewQuery.isFetching || isLoadingExisting
                }
                isProceedLoading={previewQuery.isFetching || isLoadingExisting}
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
                onBack={() => setStep(1)}
                onSubmit={handleSubmit}
                isSubmitDisabled={
                  proposals.length === 0 ||
                  batchCreateMutation.isPending ||
                  hasAnySessionImbalance
                }
                isSubmitLoading={batchCreateMutation.isPending}
              />
            )}
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
