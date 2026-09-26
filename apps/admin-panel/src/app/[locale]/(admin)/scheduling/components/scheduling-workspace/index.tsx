"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertTriangle, Calendar, CalendarClock } from "lucide-react"
import {
  calculateUncoveredStudents,
  rebalanceClassCapacities,
  type SuggestedClassDto,
  type TermDemandReportDto,
} from "@workspace/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminPageShell } from "@/components/admin-page-shell"
import { useRouter } from "@/i18n/routing"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute, useSchedulingRunStore } from "@/lib/stores"
import { selectDefaultSchedulingTerm } from "../../helper/term-selection"
import { SchedulingDemandView } from "../scheduling-demand-view"
import { SchedulingFab } from "../scheduling-fab"
import { SchedulingFilter } from "../scheduling-filter"
import {
  buildDemandItems,
  buildSuggestionDraft,
  buildWorkspaceKey,
  EMPTY_SUGGESTIONS,
} from "./helper/demand-items"

export function SchedulingWorkspace() {
  const t = useTranslations("scheduling")
  const router = useRouter()
  const { activeInstituteId } = useActiveInstitute()
  const { clearActiveRun } = useSchedulingRunStore()
  const nextSuggestionKey = React.useRef(0)
  const [maxStudentsPerClass, setMaxStudentsPerClass] = React.useState(14)
  const [shortfallDialogOpen, setShortfallDialogOpen] = React.useState(false)
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
  const [suggestionDraft, setSuggestionDraft] = React.useState<{
    key: string
    values: Record<string, SuggestedClassDto[]>
  } | null>(null)

  const termsQuery = useQuery({
    ...schedulingResource.terms.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })
  const selectedTerm = React.useMemo(
    () => selectDefaultSchedulingTerm(termsQuery.data),
    [termsQuery.data]
  )
  const workspaceKey = buildWorkspaceKey(
    selectedTerm?.id,
    branchId,
    activeInstituteId,
    maxStudentsPerClass
  )
  const demandData =
    demandResult?.key === workspaceKey ? demandResult.data : null
  const suggestions =
    suggestionDraft?.key === workspaceKey
      ? suggestionDraft.values
      : EMPTY_SUGGESTIONS

  React.useEffect(() => {
    clearActiveRun()
  }, [activeInstituteId, clearActiveRun])

  const calculateMutation = useMutation({
    ...schedulingResource.calculateDemand.toMutation(),
    onSuccess: (data, variables) => {
      const key = buildWorkspaceKey(
        variables.termId,
        variables.branchId,
        variables.instituteId,
        variables.maxStudentsPerClass
      )
      setDemandResult({ key, data })
      setSuggestionDraft({ key, values: buildSuggestionDraft(data.courses) })
      setShortfallDialogOpen(false)
    },
  })
  const calculateDemand = calculateMutation.mutate

  React.useEffect(() => {
    if (!selectedTerm) return
    calculateDemand({
      termId: selectedTerm.id,
      branchId: branchId && branchId !== "all" ? branchId : undefined,
      instituteId: activeInstituteId || undefined,
      maxStudentsPerClass,
    })
  }, [
    selectedTerm,
    branchId,
    activeInstituteId,
    maxStudentsPerClass,
    calculateDemand,
  ])

  const updateSuggestions = React.useCallback(
    (
      courseId: string,
      updater: (current: SuggestedClassDto[]) => SuggestedClassDto[]
    ) => {
      setSuggestionDraft((currentDraft) => {
        const currentValues =
          currentDraft?.key === workspaceKey
            ? currentDraft.values
            : EMPTY_SUGGESTIONS
        return {
          key: workspaceKey,
          values: {
            ...currentValues,
            [courseId]: updater(currentValues[courseId] ?? []),
          },
        }
      })
      setShortfallDialogOpen(false)
    },
    [workspaceKey]
  )

  const getCourse = React.useCallback(
    (courseId: string) =>
      demandData?.courses.find((course) => course.courseId === courseId),
    [demandData?.courses]
  )

  const handleCapacityChange = React.useCallback(
    (courseId: string, classKey: string, capacity: number) => {
      const course = getCourse(courseId)
      if (!course || !demandData) return
      updateSuggestions(courseId, (current) => {
        const fixedIndex = current.findIndex((item) => item.key === classKey)
        if (fixedIndex < 0) return current
        const nextCapacities = current.map((item, index) =>
          index === fixedIndex ? capacity : item.capacity
        )
        const balanced = rebalanceClassCapacities(
          course.eligibleStudentsCount,
          nextCapacities,
          demandData.effectiveCapacityLimit,
          fixedIndex
        )
        return current.map((item, index) => ({
          ...item,
          capacity: balanced[index] ?? item.capacity,
        }))
      })
    },
    [demandData, getCourse, updateSuggestions]
  )

  const handleAddClass = React.useCallback(
    (courseId: string) => {
      const course = getCourse(courseId)
      if (!course || !demandData) return
      updateSuggestions(courseId, (current) => {
        nextSuggestionKey.current += 1
        const next = [
          ...current,
          {
            key: `${courseId}:manual:${nextSuggestionKey.current}`,
            capacity: 1,
          },
        ]
        const balanced = rebalanceClassCapacities(
          course.eligibleStudentsCount,
          next.map((item) => item.capacity),
          demandData.effectiveCapacityLimit
        )
        return next.map((item, index) => ({
          ...item,
          capacity: balanced[index] ?? item.capacity,
        }))
      })
    },
    [demandData, getCourse, updateSuggestions]
  )

  const handleRemoveClass = React.useCallback(
    (courseId: string, classKey: string) => {
      const course = getCourse(courseId)
      if (!course || !demandData) return
      updateSuggestions(courseId, (current) => {
        const next = current.filter((item) => item.key !== classKey)
        if (next.length === 0) return []
        const balanced = rebalanceClassCapacities(
          course.eligibleStudentsCount,
          next.map((item) => item.capacity),
          demandData.effectiveCapacityLimit
        )
        return next.map((item, index) => ({
          ...item,
          capacity: balanced[index] ?? item.capacity,
        }))
      })
    },
    [demandData, getCourse, updateSuggestions]
  )

  const totalUncoveredStudents = React.useMemo(
    () =>
      (demandData?.courses ?? []).reduce(
        (total, course) =>
          total +
          calculateUncoveredStudents(
            course.eligibleStudentsCount,
            (suggestions[course.courseId] ?? course.suggestedClasses).map(
              (item) => item.capacity
            )
          ),
        0
      ),
    [demandData?.courses, suggestions]
  )

  const applyMutation = useMutation({
    ...schedulingResource.applyDemand.toMutation(),
    onSuccess: (data) => {
      toast.success(t("demand.applySuccess", { count: data.totalRequirements }))
      const params = new URLSearchParams({ termId: selectedTerm?.id ?? "" })
      if (branchId && branchId !== "all") params.set("branchId", branchId)
      router.push(`/scheduling/generate?${params.toString()}`)
    },
  })

  const applyReviewedDemand = React.useCallback(
    (acknowledgeShortfall: boolean) => {
      if (!selectedTerm || !demandData) return
      applyMutation.mutate({
        termId: selectedTerm.id,
        branchId: branchId && branchId !== "all" ? branchId : undefined,
        instituteId: activeInstituteId || undefined,
        acknowledgeShortfall,
        items: buildDemandItems(demandData.courses, suggestions),
      })
    },
    [
      selectedTerm,
      demandData,
      applyMutation,
      branchId,
      activeInstituteId,
      suggestions,
    ]
  )

  const handleGenerateSchedule = React.useCallback(() => {
    if (!selectedTerm || !demandData) return
    if (totalUncoveredStudents > 0) {
      setShortfallDialogOpen(true)
      return
    }
    applyReviewedDemand(false)
  }, [selectedTerm, demandData, totalUncoveredStudents, applyReviewedDemand])

  const isActionPending = calculateMutation.isPending || applyMutation.isPending

  return (
    <>
      <AdminPageShell
        filter={
          <SchedulingFilter
            term={selectedTerm}
            isLoadingTerm={termsQuery.isLoading}
            branchId={branchId}
            onBranchChange={setBranchId}
            maxStudentsPerClass={maxStudentsPerClass}
            onMaxStudentsPerClassChange={setMaxStudentsPerClass}
            maxAvailableRoomCapacity={
              demandData?.maxAvailableRoomCapacity ?? null
            }
            onGenerateSchedule={handleGenerateSchedule}
            isGenerating={isActionPending}
          />
        }
        fab={
          <SchedulingFab
            termId={selectedTerm?.id}
            onGenerateSchedule={handleGenerateSchedule}
            disabled={!selectedTerm || !demandData || isActionPending}
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
          <SchedulingDemandView
            termId={selectedTerm.id}
            demandData={demandData}
            isLoading={calculateMutation.isPending}
            suggestions={suggestions}
            totalUncoveredStudents={totalUncoveredStudents}
            onCapacityChange={handleCapacityChange}
            onAddClass={handleAddClass}
            onRemoveClass={handleRemoveClass}
          />
        )}
      </AdminPageShell>

      <AlertDialog
        open={shortfallDialogOpen}
        onOpenChange={setShortfallDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("demand.shortfall.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("demand.shortfall.description", {
                count: totalUncoveredStudents,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("demand.shortfall.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => applyReviewedDemand(true)}
              disabled={applyMutation.isPending}
            >
              {t("demand.shortfall.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
