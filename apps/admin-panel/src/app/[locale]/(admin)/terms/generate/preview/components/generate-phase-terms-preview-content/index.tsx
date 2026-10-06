"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check } from "lucide-react"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { useRouter } from "@/i18n/routing"
import { useGeneratePhaseTerms } from "../../../hooks/use-generate-phase-terms"
import { StepPreview } from "../../../components/step-preview"
import { PreviewFilter } from "../preview-filter"

export function GeneratePhaseTermsPreviewContent() {
  const t = useTranslations("terms")
  const tCommon = useTranslations("common")
  const router = useRouter()

  const {
    viewMode,
    setViewMode,
    proposals,
    hasAnySessionImbalance,
    dateConflicts,
    hasAnyDateConflict,
    batchCreateMutation,
    observeOfficialHolidays,
    customOffDays,
    activeDismissedHolidays,
    compensatorySessions,
    handleTitleChange,
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
    handleAddCompensatorySession,
    handleRemoveCompensatorySession,
    handleSubmit,
    existingTerms,
  } = useGeneratePhaseTerms()

  React.useEffect(() => {
    if (proposals.length === 0) {
      router.replace("/terms/generate")
    }
  }, [proposals.length, router])

  if (proposals.length === 0) {
    return null
  }

  const isSubmitDisabled =
    proposals.length === 0 ||
    batchCreateMutation.isPending ||
    hasAnySessionImbalance ||
    hasAnyDateConflict

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="forbidden">
        <AdminPageShell
          backHref="/terms/generate"
          backLabel={t("batchModal.title")}
          breadcrumb={
            <AdminBreadcrumb
              backHref="/terms/generate"
              backLabel={t("batchModal.title")}
              items={[
                { label: tCommon("nav.terms"), href: "/terms" },
                { label: t("batchModal.title"), href: "/terms/generate" },
                { label: t("batchModal.step2Title") },
              ]}
            />
          }
          filter={
            <PreviewFilter
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSubmit={handleSubmit}
              isSubmitDisabled={isSubmitDisabled}
              isSubmitLoading={batchCreateMutation.isPending}
            />
          }
          fab={
            <FABSingle
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              aria-label={t("batchModal.submit")}
            >
              {batchCreateMutation.isPending ? (
                <Spinner className="size-6 text-primary-foreground" />
              ) : (
                <Check className="size-6 text-primary-foreground" />
              )}
            </FABSingle>
          }
        >
          <StepPreview
            proposals={proposals}
            viewMode={viewMode}
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
            dateConflicts={dateConflicts}
            existingTerms={existingTerms}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
