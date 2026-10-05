"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { useRouter } from "@/i18n/routing"
import { useGeneratePhaseTerms } from "../../../hooks/use-generate-phase-terms"
import { StepPreview } from "../../../components/step-preview"

export function GeneratePhaseTermsPreviewContent() {
  const t = useTranslations("terms")
  const tCommon = useTranslations("common")
  const router = useRouter()

  const {
    viewMode,
    setViewMode,
    proposals,
    hasAnySessionImbalance,
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
  } = useGeneratePhaseTerms()

  React.useEffect(() => {
    if (proposals.length === 0) {
      router.replace("/terms/generate")
    }
  }, [proposals.length, router])

  if (proposals.length === 0) {
    return null
  }

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="forbidden">
        <AdminPageShell
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
        >
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
            onSubmit={handleSubmit}
            isSubmitDisabled={
              proposals.length === 0 ||
              batchCreateMutation.isPending ||
              hasAnySessionImbalance
            }
            isSubmitLoading={batchCreateMutation.isPending}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
