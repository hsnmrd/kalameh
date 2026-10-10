"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeftRight,
  Building2,
  CalendarClock,
  Info,
  User,
} from "lucide-react"
import type { SchedulingPlanDetailsDto, WeekDay } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  getProposalClassroomId,
  getProposalTeacherId,
  isCombinationValid,
  resolveFreeTeacherTargetDays,
  type OccupiedClassroomSlot,
  type SwapCombinationFlags,
  type SwapEvaluationResult,
  type SwapTarget,
} from "../helper/swap-eligibility.helper"
import {
  planSessionSwap,
  type ClassroomOption,
  type SessionSwapExecutionPlan,
} from "../helper/period-classroom-resolver.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface SwapClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceProposal: Proposal | null
  target: SwapTarget | null
  evaluation: SwapEvaluationResult | null
  allProposals?: Proposal[]
  instituteClassrooms?: ClassroomOption[]
  occupiedClassroomSlots?: OccupiedClassroomSlot[]
  onSwapSuccess?: (updatedProposals: Proposal[]) => void
}

export function SwapClassDialog({
  open,
  onOpenChange,
  sourceProposal,
  target,
  evaluation,
  allProposals,
  instituteClassrooms,
  occupiedClassroomSlots,
  onSwapSuccess,
}: SwapClassDialogProps) {
  const t = useTranslations("scheduling.planDetails")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const selectionKey = React.useMemo(() => {
    if (!sourceProposal || !target) return ""
    const targetKey =
      target.kind === "PROPOSAL"
        ? target.proposal.id
        : `${target.teacher.id}-${target.dayOfWeek}-${target.startTime}`
    return `${sourceProposal.id}:${targetKey}`
  }, [sourceProposal, target])

  const [overrideState, setOverrideState] = React.useState<{
    key: string
    flags: SwapCombinationFlags
  } | null>(null)

  const flags: SwapCombinationFlags =
    overrideState?.key === selectionKey
      ? overrideState.flags
      : (evaluation?.defaultSelection ?? {
          changeTeacher: false,
          changeClassroom: false,
          changeDate: false,
        })

  const updateMutation = useMutation({
    ...schedulingResource.updateProposal.toMutation(),
  })

  const swapPlan = React.useMemo<SessionSwapExecutionPlan | null>(() => {
    if (!sourceProposal || !target || target.kind !== "PROPOSAL") return null
    const classroomsMap = new Map<string, ClassroomOption>()
    for (const p of allProposals ?? [sourceProposal, target.proposal]) {
      if (p.classroom) {
        const existing = classroomsMap.get(p.classroom.id)
        if (!existing || p.classroom.capacity > existing.capacity) {
          classroomsMap.set(p.classroom.id, p.classroom)
        }
      }
    }
    const classrooms =
      instituteClassrooms && instituteClassrooms.length > 0
        ? instituteClassrooms
        : Array.from(classroomsMap.values())
    return planSessionSwap(
      sourceProposal,
      target.proposal,
      allProposals ?? [sourceProposal, target.proposal],
      classrooms,
      occupiedClassroomSlots
    )
  }, [
    sourceProposal,
    target,
    allProposals,
    instituteClassrooms,
    occupiedClassroomSlots,
  ])

  if (!sourceProposal || !target || !evaluation) return null

  const isSelectionValid = isCombinationValid(evaluation, flags)

  const formatDays = (days: WeekDay[]) =>
    days.map((day) => t(`weekDays.${day}`)).join(t("daySeparator"))

  const sourceTeacherName = sourceProposal.teacher
    ? `${sourceProposal.teacher.firstName} ${sourceProposal.teacher.lastName}`
    : t("hiringPlan.pendingTeacher")
  const targetTeacherName =
    target.kind === "PROPOSAL"
      ? target.proposal.teacher
        ? `${target.proposal.teacher.firstName} ${target.proposal.teacher.lastName}`
        : t("hiringPlan.pendingTeacher")
      : `${target.teacher.firstName} ${target.teacher.lastName}`

  const sourceRoomName =
    sourceProposal.deliveryMode === "ONLINE"
      ? t("deliveryModes.ONLINE")
      : sourceProposal.classroom?.name || t("location")
  const targetRoomName =
    target.kind === "PROPOSAL"
      ? target.proposal.deliveryMode === "ONLINE"
        ? t("deliveryModes.ONLINE")
        : target.proposal.classroom?.name || t("location")
      : sourceRoomName

  const sourceScheduleLabel = `${formatDays(sourceProposal.daysOfWeek)} · ${sourceProposal.startTime}–${sourceProposal.endTime}`
  const targetDays =
    target.kind === "PROPOSAL"
      ? target.proposal.daysOfWeek
      : resolveFreeTeacherTargetDays(sourceProposal, target)
  const targetStartTime =
    target.kind === "PROPOSAL" ? target.proposal.startTime : target.startTime
  const targetEndTime =
    target.kind === "PROPOSAL" ? target.proposal.endTime : target.endTime
  const targetScheduleLabel = `${formatDays(targetDays)} · ${targetStartTime}–${targetEndTime}`

  const previewSourceTeacherName =
    target.kind === "PROPOSAL"
      ? flags.changeDate
        ? t("calendarView.newTeacherBadge")
        : flags.changeTeacher
          ? targetTeacherName
          : sourceTeacherName
      : flags.changeTeacher
        ? targetTeacherName
        : sourceTeacherName

  const previewTargetTeacherName =
    target.kind === "PROPOSAL"
      ? flags.changeDate
        ? t("calendarView.newTeacherBadge")
        : flags.changeTeacher
          ? sourceTeacherName
          : targetTeacherName
      : flags.changeTeacher
        ? sourceTeacherName
        : targetTeacherName

  const previewSourceRoomName =
    target.kind === "PROPOSAL" && flags.changeDate
      ? sourceProposal.deliveryMode === "ONLINE"
        ? t("deliveryModes.ONLINE")
        : (swapPlan?.sourceNewClassroom?.name ?? targetRoomName)
      : flags.changeClassroom
        ? targetRoomName
        : sourceRoomName

  const previewTargetRoomName =
    target.kind === "PROPOSAL" && flags.changeDate
      ? target.proposal.deliveryMode === "ONLINE"
        ? t("deliveryModes.ONLINE")
        : (swapPlan?.targetNewClassroom?.name ?? sourceRoomName)
      : flags.changeClassroom
        ? sourceRoomName
        : targetRoomName

  const previewSourceScheduleLabel = flags.changeDate
    ? targetScheduleLabel
    : sourceScheduleLabel
  const previewTargetScheduleLabel = flags.changeDate
    ? sourceScheduleLabel
    : targetScheduleLabel

  const handleToggleFlag = (
    key: keyof SwapCombinationFlags,
    checked: boolean
  ) => {
    const prev = flags
    const next = { ...prev, [key]: checked }

    if (!checked) {
      if (key === "changeDate" && prev.changeClassroom) {
        const withoutRoom = { ...next, changeClassroom: false }
        setOverrideState({ key: selectionKey, flags: withoutRoom })
        return
      }
      if (key === "changeClassroom" && prev.changeDate) {
        const withoutDate = { ...next, changeDate: false }
        setOverrideState({ key: selectionKey, flags: withoutDate })
        return
      }
      if (isCombinationValid(evaluation, next)) {
        setOverrideState({ key: selectionKey, flags: next })
        return
      }
      setOverrideState({ key: selectionKey, flags: next })
      return
    }

    if (key === "changeDate") {
      const allThree = {
        changeTeacher: true,
        changeClassroom: true,
        changeDate: true,
      }
      if (isCombinationValid(evaluation, allThree)) {
        setOverrideState({ key: selectionKey, flags: allThree })
        return
      }
      const withRoom = {
        changeTeacher: false,
        changeClassroom: true,
        changeDate: true,
      }
      if (isCombinationValid(evaluation, withRoom)) {
        setOverrideState({ key: selectionKey, flags: withRoom })
        return
      }
    }
    if (key === "changeClassroom" && evaluation.canChangeDate) {
      const allThree = {
        changeTeacher: true,
        changeClassroom: true,
        changeDate: true,
      }
      if (isCombinationValid(evaluation, allThree)) {
        setOverrideState({ key: selectionKey, flags: allThree })
        return
      }
      const withDate = {
        changeTeacher: false,
        changeClassroom: true,
        changeDate: true,
      }
      if (isCombinationValid(evaluation, withDate)) {
        setOverrideState({ key: selectionKey, flags: withDate })
        return
      }
    }
    if (isCombinationValid(evaluation, next)) {
      setOverrideState({ key: selectionKey, flags: next })
      return
    }
    const fallbackValid = evaluation.validCombinations.find(
      (combo) => combo[key]
    )
    if (fallbackValid) {
      setOverrideState({ key: selectionKey, flags: fallbackValid })
      return
    }
    setOverrideState({ key: selectionKey, flags: next })
  }

  const handleOptionCardClick = (
    e: React.MouseEvent<HTMLDivElement>,
    key: keyof SwapCombinationFlags
  ) => {
    const targetEl = e.target as HTMLElement
    if (targetEl.closest('[role="checkbox"], input')) return
    handleToggleFlag(key, !flags[key])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSelectionValid || updateMutation.isPending) return

    const effectiveInstituteId = activeInstituteId || sourceProposal.instituteId
    const sourceTeacherId = getProposalTeacherId(sourceProposal)
    const sourceClassroomId = getProposalClassroomId(sourceProposal)
    const updatedProposals: Proposal[] = []

    try {
      if (target.kind === "PROPOSAL") {
        const targetProposal = target.proposal
        const isSourceMissed = sourceProposal.id.startsWith("missed:")
        const isTargetMissed = targetProposal.id.startsWith("missed:")

        if (flags.changeDate) {
          const classroomsMap = new Map<string, ClassroomOption>()
          for (const p of allProposals ?? [sourceProposal, targetProposal]) {
            if (p.classroom) {
              const existing = classroomsMap.get(p.classroom.id)
              if (!existing || p.classroom.capacity > existing.capacity) {
                classroomsMap.set(p.classroom.id, p.classroom)
              }
            }
          }
          const classrooms =
            instituteClassrooms && instituteClassrooms.length > 0
              ? instituteClassrooms
              : Array.from(classroomsMap.values())

          const plan =
            swapPlan ??
            planSessionSwap(
              sourceProposal,
              targetProposal,
              allProposals ?? [sourceProposal, targetProposal],
              classrooms,
              occupiedClassroomSlots
            )

          if (!isSourceMissed) {
            await updateMutation.mutateAsync({
              planId: sourceProposal.planId,
              proposalId: sourceProposal.id,
              instituteId: effectiveInstituteId,
              body: {
                teacherId: null,
                classroomId: plan.sourceNewClassroom?.id ?? null,
                daysOfWeek: plan.sourceNewDays,
                startTime: plan.sourceNewStartTime,
                endTime: plan.sourceNewEndTime,
              },
            })
          }

          if (!isTargetMissed) {
            await updateMutation.mutateAsync({
              planId: targetProposal.planId,
              proposalId: targetProposal.id,
              instituteId: effectiveInstituteId,
              body: {
                teacherId: null,
                classroomId: plan.targetNewClassroom?.id ?? null,
                daysOfWeek: plan.targetNewDays,
                startTime: plan.targetNewStartTime,
                endTime: plan.targetNewEndTime,
              },
            })
          }

          for (const reassignment of plan.innerReassignments) {
            if (!reassignment.proposal.id.startsWith("missed:")) {
              await updateMutation.mutateAsync({
                planId: reassignment.proposal.planId,
                proposalId: reassignment.proposal.id,
                instituteId: effectiveInstituteId,
                body: {
                  classroomId: reassignment.toClassroom.id,
                },
              })
            }
          }

          updatedProposals.push(
            {
              ...sourceProposal,
              teacherId: undefined,
              teacher: null,
              classroomId: plan.sourceNewClassroom?.id ?? null,
              classroom: plan.sourceNewClassroom
                ? {
                    id: plan.sourceNewClassroom.id,
                    name: plan.sourceNewClassroom.name,
                    capacity: plan.sourceNewClassroom.capacity,
                  }
                : null,
              daysOfWeek: plan.sourceNewDays,
              startTime: plan.sourceNewStartTime,
              endTime: plan.sourceNewEndTime,
              isManuallyEdited: true,
            },
            {
              ...targetProposal,
              teacherId: undefined,
              teacher: null,
              classroomId: plan.targetNewClassroom?.id ?? null,
              classroom: plan.targetNewClassroom
                ? {
                    id: plan.targetNewClassroom.id,
                    name: plan.targetNewClassroom.name,
                    capacity: plan.targetNewClassroom.capacity,
                  }
                : null,
              daysOfWeek: plan.targetNewDays,
              startTime: plan.targetNewStartTime,
              endTime: plan.targetNewEndTime,
              isManuallyEdited: true,
            }
          )

          for (const reassignment of plan.innerReassignments) {
            updatedProposals.push({
              ...reassignment.proposal,
              classroomId: reassignment.toClassroom.id,
              classroom: {
                id: reassignment.toClassroom.id,
                name: reassignment.toClassroom.name,
                capacity: reassignment.toClassroom.capacity,
              },
              isManuallyEdited: true,
            })
          }
        } else {
          const targetTeacherId = getProposalTeacherId(targetProposal)
          const targetClassroomId = getProposalClassroomId(targetProposal)

          if (!isSourceMissed) {
            await updateMutation.mutateAsync({
              planId: sourceProposal.planId,
              proposalId: sourceProposal.id,
              instituteId: effectiveInstituteId,
              body: {
                ...(flags.changeTeacher
                  ? { teacherId: targetTeacherId ?? null }
                  : {}),
                ...(flags.changeClassroom
                  ? { classroomId: targetClassroomId ?? null }
                  : {}),
              },
            })
          }

          if (!isTargetMissed) {
            await updateMutation.mutateAsync({
              planId: targetProposal.planId,
              proposalId: targetProposal.id,
              instituteId: effectiveInstituteId,
              body: {
                ...(flags.changeTeacher
                  ? { teacherId: sourceTeacherId ?? null }
                  : {}),
                ...(flags.changeClassroom
                  ? { classroomId: sourceClassroomId ?? null }
                  : {}),
              },
            })
          }

          updatedProposals.push(
            {
              ...sourceProposal,
              ...(flags.changeTeacher
                ? {
                    teacherId: targetTeacherId ?? undefined,
                    teacher: targetProposal.teacher,
                  }
                : {}),
              ...(flags.changeClassroom
                ? {
                    classroomId: targetClassroomId,
                    classroom: targetProposal.classroom,
                  }
                : {}),
              isManuallyEdited: true,
            },
            {
              ...targetProposal,
              ...(flags.changeTeacher
                ? {
                    teacherId: sourceTeacherId ?? undefined,
                    teacher: sourceProposal.teacher,
                  }
                : {}),
              ...(flags.changeClassroom
                ? {
                    classroomId: sourceClassroomId,
                    classroom: sourceProposal.classroom,
                  }
                : {}),
              isManuallyEdited: true,
            }
          )
        }
      } else {
        await updateMutation.mutateAsync({
          planId: sourceProposal.planId,
          proposalId: sourceProposal.id,
          instituteId: effectiveInstituteId,
          body: {
            ...(flags.changeTeacher ? { teacherId: target.teacher.id } : {}),
            ...(flags.changeDate
              ? {
                  daysOfWeek: targetDays,
                  startTime: target.startTime,
                  endTime: target.endTime,
                }
              : {}),
          },
        })

        updatedProposals.push({
          ...sourceProposal,
          ...(flags.changeTeacher
            ? {
                teacherId: target.teacher.id,
                teacher: target.teacher,
              }
            : {}),
          ...(flags.changeDate
            ? {
                daysOfWeek: targetDays,
                startTime: target.startTime,
                endTime: target.endTime,
              }
            : {}),
          isManuallyEdited: true,
        })
      }

      const realUpdatedProposals = updatedProposals.filter(
        (p) => !p.id.startsWith("missed:")
      )

      toast.success(
        target.kind === "PROPOSAL" && flags.changeDate
          ? t("calendarView.sessionSwapSuccess")
          : t("calendarView.swapDialog.success")
      )
      onSwapSuccess?.(updatedProposals)
      onOpenChange(false)

      if (realUpdatedProposals.length > 0) {
        const planId =
          (sourceProposal.planId && sourceProposal.planId !== "plan-missed"
            ? sourceProposal.planId
            : target.kind === "PROPOSAL"
              ? target.proposal.planId
              : "") || ""
        const updatedMap = new Map(realUpdatedProposals.map((p) => [p.id, p]))
        queryClient.setQueriesData<SchedulingPlanDetailsDto>(
          { queryKey: schedulingResource.planDetail.baseKey() },
          (current) => {
            if (!current || (planId && current.id !== planId)) return current
            return {
              ...current,
              proposals: current.proposals.map(
                (p) => updatedMap.get(p.id) ?? p
              ),
            }
          }
        )

        await queryClient.invalidateQueries({
          queryKey: schedulingResource.planDetail.baseKey(),
        })
      }
    } catch {
      // Errors are handled by the global API error toast in createMicroApi
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <ResponsiveDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <ResponsiveDialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <ArrowLeftRight aria-hidden className="size-5 text-primary" />
              <span>{t("calendarView.swapDialog.title")}</span>
            </ResponsiveDialogTitle>
            <ResponsiveDialogCloseButton />
          </div>
        </ResponsiveDialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {/* Source & Target Summary Cards */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div
                data-testid="swap-source-card"
                className="flex flex-col gap-1.5 rounded-xl border border-primary/40 bg-primary/5 p-3"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t("calendarView.swapDialog.sourceCardLabel")}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {sourceProposal.course.title}
                  </Badge>
                </div>
                <p className="truncate text-xs font-bold text-foreground">
                  {previewSourceTeacherName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {previewSourceRoomName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {previewSourceScheduleLabel}
                </p>
              </div>

              <div
                data-testid="swap-target-card"
                className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t("calendarView.swapDialog.targetCardLabel")}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {target.kind === "PROPOSAL"
                      ? target.proposal.course.title
                      : t("calendarView.freeTeacherBadge")}
                  </Badge>
                </div>
                <p className="truncate text-xs font-bold text-foreground">
                  {previewTargetTeacherName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {previewTargetRoomName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {previewTargetScheduleLabel}
                </p>
              </div>
            </div>

            {/* If session swap, show notice */}
            {target.kind === "PROPOSAL" && flags.changeDate && (
              <div
                data-testid="session-swap-notice"
                className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 text-xs text-foreground"
              >
                <Info
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-foreground"
                />
                <span>{t("calendarView.sessionSwapNotice")}</span>
              </div>
            )}

            {/* If inner reassignments exist, show notice */}
            {swapPlan &&
              swapPlan.innerReassignments.length > 0 &&
              flags.changeDate && (
                <div
                  data-testid="swap-inner-reassignments-notice"
                  className="flex flex-col gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3.5 text-xs text-foreground"
                >
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Building2 aria-hidden className="size-4 text-foreground" />
                    <span>{t("calendarView.swapInnerReassignmentsTitle")}</span>
                  </div>
                  <ul className="flex list-disc flex-col gap-1 pr-4 text-muted-foreground">
                    {swapPlan.innerReassignments.map((r) => (
                      <li key={r.proposal.id}>
                        {t("calendarView.swapInnerReassignmentItem", {
                          title: r.proposal.course.title,
                          room: r.toClassroom.name,
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Swap Option Checkboxes */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-foreground">
                {t("calendarView.swapDialog.optionsTitle")}
              </span>

              {evaluation.canChangeTeacher && (
                <div
                  data-testid="swap-option-teacher-label"
                  onClick={(e) => handleOptionCardClick(e, "changeTeacher")}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors select-none",
                    flags.changeTeacher
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    id="swap-option-teacher"
                    data-testid="swap-option-teacher"
                    checked={flags.changeTeacher}
                    onCheckedChange={(checked) =>
                      handleToggleFlag("changeTeacher", Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <User aria-hidden className="size-4 text-foreground" />
                      <span>{t("calendarView.swapDialog.changeTeacher")}</span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {t("calendarView.swapDialog.changeTeacherHint", {
                        from: sourceTeacherName,
                        to: targetTeacherName,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {evaluation.canChangeClassroom && (
                <div
                  data-testid="swap-option-classroom-label"
                  onClick={(e) => handleOptionCardClick(e, "changeClassroom")}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors select-none",
                    flags.changeClassroom
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    id="swap-option-classroom"
                    data-testid="swap-option-classroom"
                    checked={flags.changeClassroom}
                    onCheckedChange={(checked) =>
                      handleToggleFlag("changeClassroom", Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <Building2
                        aria-hidden
                        className="size-4 text-foreground"
                      />
                      <span>
                        {t("calendarView.swapDialog.changeClassroom")}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {t("calendarView.swapDialog.changeClassroomHint", {
                        from: sourceRoomName,
                        to: targetRoomName,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {evaluation.canChangeDate && (
                <div
                  data-testid="swap-option-date-label"
                  onClick={(e) => handleOptionCardClick(e, "changeDate")}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors select-none",
                    flags.changeDate
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/30"
                  )}
                >
                  <Checkbox
                    id="swap-option-date"
                    data-testid="swap-option-date"
                    checked={flags.changeDate}
                    onCheckedChange={(checked) =>
                      handleToggleFlag("changeDate", Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <CalendarClock
                        aria-hidden
                        className="size-4 text-foreground"
                      />
                      <span>{t("calendarView.swapDialog.changeDate")}</span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {t("calendarView.swapDialog.changeDateHint", {
                        from: sourceScheduleLabel,
                        to: targetScheduleLabel,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {!isSelectionValid && (
                <p
                  data-testid="swap-invalid-combination-msg"
                  className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
                >
                  {t("calendarView.swapDialog.invalidCombination")}
                </p>
              )}
            </div>
          </div>

          <ResponsiveDialogFooter className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("calendarView.swapDialog.cancel")}
            </Button>
            <Button
              type="submit"
              data-testid="swap-confirm-btn"
              disabled={!isSelectionValid || updateMutation.isPending}
            >
              {updateMutation.isPending && <Spinner data-icon="inline-start" />}
              {t("calendarView.swapDialog.confirm")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
