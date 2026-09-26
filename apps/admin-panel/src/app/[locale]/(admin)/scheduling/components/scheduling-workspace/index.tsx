"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Calendar, CalendarClock } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import type { TermDemandReportDto } from "@workspace/types"
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
import { useActiveInstitute, useSchedulingRunStore } from "@/lib/stores"
import { useRouter } from "@/i18n/routing"
import { selectDefaultSchedulingTerm } from "../../helper/term-selection"
import {
  SchedulingDemandView,
  type CourseAdjustment,
} from "../scheduling-demand-view"
import { SchedulingFab } from "../scheduling-fab"
import { SchedulingFilter } from "../scheduling-filter"
import {
  buildDemandItems,
  buildWorkspaceKey,
  EMPTY_ADJUSTMENTS,
} from "./helper/demand-items"

export function SchedulingWorkspace() {
  const t = useTranslations("scheduling")
  const router = useRouter()
  const { activeInstituteId } = useActiveInstitute()
  const { clearActiveRun } = useSchedulingRunStore()

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
  const [demandResult, setDemandResult] = React.useState<{
    key: string
    data: TermDemandReportDto
  } | null>(null)
  const [adjustmentDraft, setAdjustmentDraft] = React.useState<{
    key: string
    values: Record<string, CourseAdjustment>
  } | null>(null)

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

  const workspaceKey = buildWorkspaceKey(
    selectedTerm?.id,
    branchId,
    activeInstituteId
  )
  const demandData =
    demandResult?.key === workspaceKey ? demandResult.data : null
  const adjustments =
    adjustmentDraft?.key === workspaceKey
      ? adjustmentDraft.values
      : EMPTY_ADJUSTMENTS

  // The active scheduling run is external store state and must be cleared
  // whenever the tenant context changes.
  React.useEffect(() => {
    clearActiveRun()
  }, [activeInstituteId, clearActiveRun])

  const handleAdjustmentChange = React.useCallback(
    (courseId: string, changes: CourseAdjustment) => {
      setAdjustmentDraft((currentDraft) => {
        const currentValues =
          currentDraft?.key === workspaceKey
            ? currentDraft.values
            : EMPTY_ADJUSTMENTS
        return {
          key: workspaceKey,
          values: {
            ...currentValues,
            [courseId]: {
              ...currentValues[courseId],
              ...changes,
            },
          },
        }
      })
    },
    [workspaceKey]
  )

  const calculateMutation = useMutation({
    ...schedulingResource.calculateDemand.toMutation(),
    onSuccess: (data, variables) => {
      setDemandResult({
        key: buildWorkspaceKey(
          variables.termId,
          variables.branchId,
          variables.instituteId
        ),
        data,
      })
    },
  })
  const calculateDemand = calculateMutation.mutate

  const applyMutation = useMutation({
    ...schedulingResource.applyDemand.toMutation(),
    onSuccess: (data) => {
      toast.success(t("demand.applySuccess", { count: data.totalRequirements }))
      router.push("/scheduling/generate")
    },
  })

  // Automatically trigger demand calculation when eligible term or branch changes
  React.useEffect(() => {
    if (selectedTerm) {
      calculateDemand({
        termId: selectedTerm.id,
        branchId: branchId && branchId !== "all" ? branchId : undefined,
        instituteId: activeInstituteId || undefined,
        defaultCapacity: 14,
      })
    }
  }, [selectedTerm, branchId, activeInstituteId, calculateDemand])

  const handleGenerateSchedule = React.useCallback(() => {
    if (!selectedTerm) return

    const courses = demandData?.courses ?? []
    if (courses.length === 0) {
      router.push("/scheduling/generate")
      return
    }

    const items = buildDemandItems(courses, adjustments)

    if (items.length === 0) {
      router.push("/scheduling/generate")
      return
    }

    applyMutation.mutate({
      termId: selectedTerm.id,
      branchId: branchId && branchId !== "all" ? branchId : undefined,
      instituteId: activeInstituteId || undefined,
      items,
    })
  }, [
    selectedTerm,
    demandData?.courses,
    adjustments,
    applyMutation,
    branchId,
    activeInstituteId,
    router,
  ])

  const isActionPending = calculateMutation.isPending || applyMutation.isPending

  return (
    <AdminPageShell
      filter={
        <SchedulingFilter
          term={selectedTerm}
          isLoadingTerm={termsQuery.isLoading}
          branchId={branchId}
          onBranchChange={setBranchId}
          onGenerateSchedule={handleGenerateSchedule}
          isGenerating={isActionPending}
        />
      }
      fab={
        <SchedulingFab
          termId={selectedTerm?.id}
          onGenerateSchedule={handleGenerateSchedule}
          disabled={!selectedTerm || isActionPending}
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
          <SchedulingDemandView
            termId={selectedTerm.id}
            demandData={demandData}
            isLoading={calculateMutation.isPending}
            adjustments={adjustments}
            onAdjustmentChange={handleAdjustmentChange}
          />
        </div>
      )}
    </AdminPageShell>
  )
}
