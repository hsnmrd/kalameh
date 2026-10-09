"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check } from "lucide-react"
import { APP_MODULES, PERMISSIONS, hasFutureDays } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "../../../modal"
import { useRouter } from "@/i18n/routing"
import { useModal } from "@/lib/hooks"
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

  const isSubmittingRef = React.useRef(false)
  if (batchCreateMutation.isPending || batchCreateMutation.isSuccess) {
    isSubmittingRef.current = true
  }

  React.useEffect(() => {
    if (
      proposals.length === 0 &&
      !isSubmittingRef.current &&
      !batchCreateMutation.isPending &&
      !batchCreateMutation.isSuccess
    ) {
      router.replace("/terms?modal=generatePhaseTerms")
    }
  }, [
    proposals.length,
    batchCreateMutation.isPending,
    batchCreateMutation.isSuccess,
    router,
  ])

  if (
    proposals.length === 0 &&
    !isSubmittingRef.current &&
    !batchCreateMutation.isSuccess
  ) {
    return null
  }

  const hasPastTerms = React.useMemo(() => {
    return proposals.some((p) => !hasFutureDays(p))
  }, [proposals])

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
