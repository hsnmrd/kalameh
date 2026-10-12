"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { APP_MODULES, PERMISSIONS, hasFutureDays } from "@workspace/types"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "../../../modal"
import { useRouter } from "@/i18n/routing"
import { useModal } from "@/lib/hooks"
import { usePhaseTermsGenerateStore } from "@/lib/stores"
import { useGeneratePhaseTerms } from "../../hooks/use-generate-phase-terms"
import { StepPreview } from "../step-preview"
import { PreviewFilter } from "../preview-filter"

export function GeneratePhaseTermsPreviewContent() {
  const t = useTranslations("terms")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { openModal } = useModal()

  const {
    proposals,
    hasAnySessionImbalance,
    dateConflicts,
    hasAnyDateConflict,
    batchCreateMutation,
    observeOfficialHolidays,
    customOffDays,
    activeDismissedHolidays,
    compensatorySessions,
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
    handleAddCompensatorySession,
    handleRemoveCompensatorySession,
    handleSubmit,
    existingTerms,
  } = useGeneratePhaseTerms()

  const [hasHydrated, setHasHydrated] = React.useState(
    () => usePhaseTermsGenerateStore.persist?.hasHydrated?.() ?? true
  )

  React.useEffect(() => {
    if (usePhaseTermsGenerateStore.persist?.hasHydrated?.()) {
      setHasHydrated(true)
      return
    }
    const unsub = usePhaseTermsGenerateStore.persist?.onFinishHydration?.(
      () => {
        setHasHydrated(true)
      }
    )
    return unsub
  }, [])

  const isSubmittingOrSuccess =
    batchCreateMutation.isPending || batchCreateMutation.isSuccess

  React.useEffect(() => {
    if (hasHydrated && proposals.length === 0 && !isSubmittingOrSuccess) {
      router.replace("/terms?modal=generatePhaseTerms")
    }
  }, [hasHydrated, proposals.length, isSubmittingOrSuccess, router])

  const hasPastTerms = React.useMemo(() => {
    return proposals.some((p) => !hasFutureDays(p))
  }, [proposals])

  if ((!hasHydrated || proposals.length === 0) && !isSubmittingOrSuccess) {
    return null
  }

  const isSubmitDisabled =
    proposals.length === 0 ||
    batchCreateMutation.isPending ||
    hasAnySessionImbalance ||
    hasAnyDateConflict ||
    hasPastTerms

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="forbidden">
        <AdminPageShell
          backHref="/terms"
          backLabel={tCommon("nav.terms")}
          breadcrumb={
            <AdminBreadcrumb
              backHref="/terms"
              backLabel={tCommon("nav.terms")}
              items={[
                { label: tCommon("nav.terms"), href: "/terms" },
                { label: tCommon("nav.reviewPhaseTerms") },
              ]}
            />
          }
          filter={
            <PreviewFilter
              onEditConfig={() => openModal("generatePhaseTerms")}
              onSubmit={handleSubmit}
              isSubmitDisabled={isSubmitDisabled}
              isSubmitLoading={batchCreateMutation.isPending}
            />
          }
          modals={<ModalGateway registry={modalRegistry} />}
        >
          <StepPreview
            proposals={proposals}
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
