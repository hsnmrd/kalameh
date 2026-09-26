"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  APP_MODULES,
  PERMISSIONS,
  type SchedulingRunDto,
  type TermDemandReportDto,
} from "@workspace/types"
import { AdminPageShell } from "@/components/admin-page-shell"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { SchedulingDemandView } from "../components/scheduling-demand-view"
import { SchedulingGenerationView } from "../components/scheduling-generation-view"
import { SchedulingFab } from "../components/scheduling-fab"
import {
  TermWorkspaceFilter,
  type SchedulingWorkspaceTab,
} from "./components/term-workspace-filter"

function buildDemandKey(
  termId: string,
  branchId: string,
  instituteId?: string | null
) {
  const normalizedBranchId = branchId === "all" ? "" : branchId
  return `${instituteId ?? ""}:${termId}:${normalizedBranchId}`
}

export default function SingleTermSchedulingPage() {
  const t = useTranslations("scheduling")
  const tTerms = useTranslations("scheduling.termsList")
  const params = useParams()
  const termId = (params.termId as string) || ""
  const { activeInstituteId } = useActiveInstitute()

  const [activeTab, setActiveTab] =
    React.useState<SchedulingWorkspaceTab>("demand")
  const [branchSelection, setBranchSelection] = React.useState({
    instituteId: activeInstituteId,
    value: "",
  })
  const branchId =
    branchSelection.instituteId === activeInstituteId
      ? branchSelection.value
      : ""
  const setBranchId = React.useCallback(
    (value: string) =>
      setBranchSelection({ instituteId: activeInstituteId, value }),
    [activeInstituteId]
  )
  const [search, setSearch] = React.useState("")
  const [demandResult, setDemandResult] = React.useState<{
    key: string
    data: TermDemandReportDto
  } | null>(null)
  const [createdRun, setCreatedRun] = React.useState<SchedulingRunDto | null>(
    null
  )

  const termsQuery = useQuery({
    ...schedulingResource.terms.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  const currentTerm = React.useMemo(
    () => termsQuery.data?.find((term) => term.id === termId),
    [termsQuery.data, termId]
  )

  const demandKey = buildDemandKey(termId, branchId, activeInstituteId)
  const demandData = demandResult?.key === demandKey ? demandResult.data : null
  const calculateMutation = useMutation({
    ...schedulingResource.calculateDemand.toMutation(),
    onSuccess: (data, variables) => {
      setDemandResult({
        key: buildDemandKey(
          variables.termId,
          variables.branchId ?? "",
          variables.instituteId
        ),
        data,
      })
    },
  })
  const calculateDemand = calculateMutation.mutate

  const handleCalculateDemand = React.useCallback(() => {
    if (!termId) return
    calculateDemand({
      termId,
      branchId: branchId && branchId !== "all" ? branchId : undefined,
      instituteId: activeInstituteId || undefined,
      defaultCapacity: 14,
    })
  }, [termId, branchId, activeInstituteId, calculateDemand])

  // Automatically trigger demand calculation when component mounts or branch/institute changes
  React.useEffect(() => {
    if (termId) {
      calculateDemand({
        termId,
        branchId: branchId && branchId !== "all" ? branchId : undefined,
        instituteId: activeInstituteId || undefined,
        defaultCapacity: 14,
      })
    }
  }, [termId, branchId, activeInstituteId, calculateDemand])

  const activeRun =
    createdRun?.instituteId === activeInstituteId ? createdRun : null

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref="/scheduling"
              backLabel={tTerms("actions.backToTerms")}
              items={[
                { label: t("title"), href: "/scheduling" },
                { label: currentTerm?.title ?? "..." },
              ]}
            />
          }
          filter={
            <TermWorkspaceFilter
              termId={termId}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              branchId={branchId}
              onBranchChange={setBranchId}
              search={search}
              onSearchChange={setSearch}
              hasActiveRun={Boolean(activeRun)}
              onResetRun={() => setCreatedRun(null)}
            />
          }
          fab={<SchedulingFab termId={termId} />}
        >
          <div className="flex flex-col gap-6">
            {activeTab === "demand" ? (
              <SchedulingDemandView
                termId={termId}
                demandData={demandData}
                isLoading={calculateMutation.isPending}
                search={search}
                onCalculateDemand={handleCalculateDemand}
                onGenerateTimetable={() => setActiveTab("generation")}
              />
            ) : (
              <SchedulingGenerationView
                activeRun={activeRun}
                defaultTermId={termId}
                onResetRun={() => setCreatedRun(null)}
                onCreatedRun={setCreatedRun}
                onNavigateToDemand={() => setActiveTab("demand")}
              />
            )}
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
