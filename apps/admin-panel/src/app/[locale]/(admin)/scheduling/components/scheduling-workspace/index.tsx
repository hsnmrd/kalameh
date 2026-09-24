"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Calendar, CalendarClock } from "lucide-react"
import type { SchedulingRunDto, TermDemandReportDto } from "@workspace/types"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageShell } from "@/components/admin-page-shell"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter } from "@/i18n/routing"
import { selectDefaultSchedulingTerm } from "../../helper/term-selection"
import { SchedulingDemandView } from "../scheduling-demand-view"
import { SchedulingFab } from "../scheduling-fab"
import { SchedulingFilter } from "../scheduling-filter"
import { SchedulingRunStatusPanel } from "../scheduling-run-status-panel"

export function SchedulingWorkspace() {
  const t = useTranslations("scheduling")
  const router = useRouter()
  const { activeInstituteId } = useActiveInstitute()

  const [branchId, setBranchId] = React.useState("")
  const [demandData, setDemandData] =
    React.useState<TermDemandReportDto | null>(null)
  const [createdRun, setCreatedRun] = React.useState<SchedulingRunDto | null>(
    null
  )

  const termsQuery = useQuery({
    ...schedulingResource.terms.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  // Select the eligible term (starts within 10 days or currently running)
  const selectedTerm = React.useMemo(() => {
    return selectDefaultSchedulingTerm(termsQuery.data)
  }, [termsQuery.data])

  // Reset state when institute changes
  React.useEffect(() => {
    setBranchId("")
    setDemandData(null)
    setCreatedRun(null)
  }, [activeInstituteId])

  const calculateMutation = useMutation({
    ...schedulingResource.calculateDemand.toMutation(),
    onSuccess: (data) => {
      setDemandData(data)
    },
  })

  // Automatically trigger demand calculation when eligible term or branch changes
  React.useEffect(() => {
    if (selectedTerm) {
      calculateMutation.mutate({
        termId: selectedTerm.id,
        branchId: branchId && branchId !== "all" ? branchId : undefined,
        instituteId: activeInstituteId || undefined,
        defaultCapacity: 14,
      })
    } else {
      setDemandData(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm?.id, branchId, activeInstituteId])

  const handleGenerateSchedule = React.useCallback(() => {
    router.push("/scheduling/generate")
  }, [router])

  const activeRun =
    createdRun?.instituteId === activeInstituteId ? createdRun : null

  return (
    <AdminPageShell
      filter={
        <SchedulingFilter
          term={selectedTerm}
          isLoadingTerm={termsQuery.isLoading}
          branchId={branchId}
          onBranchChange={setBranchId}
          hasActiveRun={Boolean(activeRun)}
          onNewRun={handleGenerateSchedule}
          onGenerateSchedule={handleGenerateSchedule}
          isGenerating={calculateMutation.isPending}
        />
      }
      fab={
        <SchedulingFab
          termId={selectedTerm?.id}
          onGenerateSchedule={handleGenerateSchedule}
          disabled={!selectedTerm || calculateMutation.isPending}
        />
      }
    >
      {termsQuery.isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner className="size-8 text-foreground" />
        </div>
      ) : !termsQuery.data || termsQuery.data.length === 0 ? (
        <Empty variant="default" className="border border-border bg-card">
          <EmptyMedia variant="icon">
            <Calendar className="size-7 text-foreground" aria-hidden />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("termsList.empty.title")}</EmptyTitle>
            <EmptyDescription>
              {t("termsList.empty.description")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : !selectedTerm ? (
        <Empty variant="default" className="border border-border bg-card">
          <EmptyMedia variant="icon">
            <CalendarClock className="size-7 text-foreground" aria-hidden />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{t("termsList.notEligible.title")}</EmptyTitle>
            <EmptyDescription>
              {t("termsList.notEligible.description")}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          {activeRun ? (
            <SchedulingRunStatusPanel
              run={activeRun}
              onReset={() => {
                setCreatedRun(null)
              }}
            />
          ) : (
            <SchedulingDemandView
              termId={selectedTerm.id}
              demandData={demandData}
              isLoading={calculateMutation.isPending}
            />
          )}
        </div>
      )}
    </AdminPageShell>
  )
}
