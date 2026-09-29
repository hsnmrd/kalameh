"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeftRight, Building2, CalendarClock, User } from "lucide-react"
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
  type SwapCombinationFlags,
  type SwapEvaluationResult,
  type SwapTarget,
} from "../helper/swap-eligibility.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface SwapClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceProposal: Proposal | null
  target: SwapTarget | null
  evaluation: SwapEvaluationResult | null
  onSwapSuccess?: () => void
}

export function SwapClassDialog({
  open,
  onOpenChange,
  sourceProposal,
  target,
  evaluation,
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

  const handleToggleFlag = (
    key: keyof SwapCombinationFlags,
    checked: boolean
  ) => {
    const prev = flags
    const next = { ...prev, [key]: checked }
    if (isCombinationValid(evaluation, next)) {
      setOverrideState({ key: selectionKey, flags: next })
      return
    }
    // If toggling changeDate requires pairing changeClassroom (or vice versa), auto-pair when valid
    if (key === "changeDate" && checked && evaluation.canChangeClassroom) {
      const withRoom = { ...next, changeClassroom: true }
      if (isCombinationValid(evaluation, withRoom)) {
        setOverrideState({ key: selectionKey, flags: withRoom })
        return
      }
    }
    if (
      key === "changeDate" &&
      !checked &&
      prev.changeClassroom &&
      !isCombinationValid(evaluation, next)
    ) {
      const withoutRoom = { ...next, changeClassroom: false }
      if (isCombinationValid(evaluation, withoutRoom)) {
        setOverrideState({ key: selectionKey, flags: withoutRoom })
        return
      }
    }
    setOverrideState({ key: selectionKey, flags: next })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSelectionValid || updateMutation.isPending) return

    const sourceTeacherId = getProposalTeacherId(sourceProposal)
    const sourceClassroomId = getProposalClassroomId(sourceProposal)

    if (target.kind === "PROPOSAL") {
      const targetProposal = target.proposal
      const targetTeacherId = getProposalTeacherId(targetProposal)
      const targetClassroomId = getProposalClassroomId(targetProposal)

      await updateMutation.mutateAsync({
        planId: sourceProposal.planId,
        proposalId: sourceProposal.id,
        instituteId: activeInstituteId,
        body: {
          teacherId:
            (flags.changeTeacher ? targetTeacherId : sourceTeacherId) ??
            undefined,
          classroomId: flags.changeClassroom
            ? targetClassroomId
            : sourceClassroomId,
          daysOfWeek: flags.changeDate
            ? targetProposal.daysOfWeek
            : sourceProposal.daysOfWeek,
          startTime: flags.changeDate
            ? targetProposal.startTime
            : sourceProposal.startTime,
          endTime: flags.changeDate
            ? targetProposal.endTime
            : sourceProposal.endTime,
        },
      })

      await updateMutation.mutateAsync({
        planId: targetProposal.planId,
        proposalId: targetProposal.id,
        instituteId: activeInstituteId,
        body: {
          teacherId:
            (flags.changeTeacher ? sourceTeacherId : targetTeacherId) ??
            undefined,
          classroomId: flags.changeClassroom
            ? sourceClassroomId
            : targetClassroomId,
          daysOfWeek: flags.changeDate
            ? sourceProposal.daysOfWeek
            : targetProposal.daysOfWeek,
          startTime: flags.changeDate
            ? sourceProposal.startTime
            : targetProposal.startTime,
          endTime: flags.changeDate
            ? sourceProposal.endTime
            : targetProposal.endTime,
        },
      })
    } else {
      await updateMutation.mutateAsync({
        planId: sourceProposal.planId,
        proposalId: sourceProposal.id,
        instituteId: activeInstituteId,
        body: {
          teacherId: flags.changeTeacher
            ? target.teacher.id
            : (sourceTeacherId ?? undefined),
          daysOfWeek: flags.changeDate ? targetDays : sourceProposal.daysOfWeek,
          startTime: flags.changeDate
            ? target.startTime
            : sourceProposal.startTime,
          endTime: flags.changeDate ? target.endTime : sourceProposal.endTime,
        },
      })
    }

    await queryClient.invalidateQueries({
      queryKey: schedulingResource.planDetail.key({
        planId: sourceProposal.planId,
        instituteId: activeInstituteId,
      }),
    })
    toast.success(t("calendarView.swapDialog.success"))
    onOpenChange(false)
    onSwapSuccess?.()
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="overflow-hidden p-0 sm:max-w-lg">
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
              <div className="flex flex-col gap-1.5 rounded-xl border border-primary/40 bg-primary/5 p-3">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {t("calendarView.swapDialog.sourceCardLabel")}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {sourceProposal.course.title}
                  </Badge>
                </div>
                <p className="truncate text-xs font-bold text-foreground">
                  {sourceTeacherName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {sourceScheduleLabel}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/30 p-3">
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
                  {targetTeacherName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {targetScheduleLabel}
                </p>
              </div>
            </div>

            {/* Swap Option Checkboxes */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-foreground">
                {t("calendarView.swapDialog.optionsTitle")}
              </span>

              {evaluation.canChangeTeacher && (
                <label
                  htmlFor="swap-option-teacher"
                  data-testid="swap-option-teacher-label"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors",
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
                </label>
              )}

              {evaluation.canChangeClassroom && (
                <label
                  htmlFor="swap-option-classroom"
                  data-testid="swap-option-classroom-label"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors",
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
                </label>
              )}

              {evaluation.canChangeDate && (
                <label
                  htmlFor="swap-option-date"
                  data-testid="swap-option-date-label"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors",
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
                </label>
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
