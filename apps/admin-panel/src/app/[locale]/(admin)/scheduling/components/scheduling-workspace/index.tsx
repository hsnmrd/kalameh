"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Calendar, CalendarClock } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import type { ApplyTermDemandItem, TermDemandReportDto } from "@workspace/types"
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

export function SchedulingWorkspace() {
  const t = useTranslations("scheduling")
  const router = useRouter()
  const { activeInstituteId } = useActiveInstitute()
  const { clearActiveRun } = useSchedulingRunStore()

  const [branchId, setBranchId] = React.useState("")
  const [demandData, setDemandData] =
    React.useState<TermDemandReportDto | null>(null)
  const [adjustments, setAdjustments] = React.useState<
    Record<string, CourseAdjustment>
  >({})

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
    clearActiveRun()
    setAdjustments({})
  }, [activeInstituteId, clearActiveRun])

  // Reset adjustments when term or branch changes
  React.useEffect(() => {
    setAdjustments({})
  }, [selectedTerm?.id, branchId])

  const handleAdjustmentChange = React.useCallback(
    (courseId: string, changes: CourseAdjustment) => {
      setAdjustments((prev) => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          ...changes,
        },
      }))
    },
    []
  )

  const calculateMutation = useMutation({
    ...schedulingResource.calculateDemand.toMutation(),
    onSuccess: (data) => {
      setDemandData(data)
    },
  })

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
    if (!selectedTerm) return

    const courses = demandData?.courses ?? []
    if (courses.length === 0) {
      router.push("/scheduling/generate")
      return
    }

    const items: ApplyTermDemandItem[] = courses
      .map((c) => {
        const adj = adjustments[c.courseId]
        const requiredClassCount = Math.min(
          50,
          Math.max(0, adj?.suggestedClassCount ?? c.suggestedClassCount)
        )
        const capacity = Math.min(
          100,
          Math.max(1, adj?.capacity ?? c.suggestedCapacity ?? 14)
        )
        return {
          courseId: c.courseId,
          requiredClassCount,
          capacity,
          deliveryMode:
            c.suggestedOnlineCount > c.suggestedInPersonCount
              ? ("ONLINE" as const)
              : ("IN_PERSON" as const),
          sessionDurationMinutes: 90,
          sessionsPerWeek: c.sessionsPerWeek ?? 3,
        }
      })
      .filter((item) => item.requiredClassCount > 0)

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
