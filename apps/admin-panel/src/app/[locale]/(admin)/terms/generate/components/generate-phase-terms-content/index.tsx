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

export function GeneratePhaseTermsContent() {
  const t = useTranslations("terms")
  const tCommon = useTranslations("common")

  const {
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
    setProposals,
    phaseOptions,
    previewQuery,
    isLoadingExisting,
    handleProceedToPreview,
    handleCancel,
  } = useGeneratePhaseTerms()

  // Safety migration: if browser session was restored with legacy default of 18, normalize to 15 on mount
  const hasMountedRef = React.useRef(false)
  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      if (sessionsPerTerm === 18) {
        setSessionsPerTerm(15)
      }
    }
  }, [sessionsPerTerm, setSessionsPerTerm])

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.MANAGE_TERMS} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref="/terms"
              backLabel={tCommon("nav.terms")}
              items={[
                { label: tCommon("nav.terms"), href: "/terms" },
                { label: t("batchModal.title") },
              ]}
            />
          }
        >
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
            isProceedLoading={previewQuery.isFetching}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
