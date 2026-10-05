"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowLeftRight, Check, DoorOpen, Users } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface ClassroomOption {
  id: string
  name: string
  capacity: number
  branchId?: string | null
}

export interface SwitchRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: Proposal | null
  classrooms: ClassroomOption[]
  proposals: Proposal[]
  onSwitchRoom: (
    proposal: Proposal,
    targetRoomId: string,
    swapWithProposal?: Proposal
  ) => Promise<void> | void
  isPending?: boolean
}

function doTimesOverlap(p1: Proposal, p2: Proposal): boolean {
  const shareDay = p1.daysOfWeek.some((d) => p2.daysOfWeek.includes(d))
  if (!shareDay) return false
  return p1.startTime < p2.endTime && p2.startTime < p1.endTime
}

export function SwitchRoomDialog({
  open,
  onOpenChange,
  proposal,
  classrooms,
  proposals,
  onSwitchRoom,
  isPending = false,
}: SwitchRoomDialogProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    if (!open) {
      setSelectedRoomId(null)
    }
  }, [open])

  if (!proposal) return null

  const currentRoomId = proposal.classroom?.id ?? proposal.classroomId ?? null
  const currentStudents = proposal.capacity
  const currentRoomCapacity = proposal.classroom?.capacity ?? currentStudents

  // Filter classrooms by branch if proposal has a specific branch
  const relevantClassrooms = classrooms.filter((room) => {
    if (!proposal.branchId || !room.branchId) return true
    return room.branchId === proposal.branchId
  })

  const roomItems = relevantClassrooms.map((room) => {
    const isCurrent = room.id === currentRoomId
    const occupyingProposal = proposals.find(
      (p) =>
        p.id !== proposal.id &&
        (p.classroomId === room.id || p.classroom?.id === room.id) &&
        doTimesOverlap(p, proposal)
    )

    if (isCurrent) {
      return {
        room,
        isCurrent: true,
        type: "CURRENT" as const,
        isClickable: false,
        occupyingProposal: null,
        disabledReason: null,
      }
    }

    if (occupyingProposal) {
      const otherStudents = occupyingProposal.capacity
      const targetRoomFitsCurrent = room.capacity >= currentStudents
      const currentRoomFitsOther = currentRoomCapacity >= otherStudents
      const canSwap = targetRoomFitsCurrent && currentRoomFitsOther

      let disabledReason: string | null = null
      if (!currentRoomFitsOther) {
        disabledReason = t("calendarView.insufficientCapacityForOther")
      } else if (!targetRoomFitsCurrent) {
        disabledReason = t("calendarView.insufficientCapacityForCurrent")
      }

      return {
        room,
        isCurrent: false,
        type: canSwap ? ("SWAPPABLE" as const) : ("OCCUPIED_DISABLED" as const),
        isClickable: canSwap,
        occupyingProposal,
        disabledReason,
      }
    }

    // Type 2: Free room
    const targetRoomFitsCurrent = room.capacity >= currentStudents
    return {
      room,
      isCurrent: false,
      type: "FREE" as const,
      isClickable: targetRoomFitsCurrent,
      occupyingProposal: null,
      disabledReason: targetRoomFitsCurrent
        ? null
        : t("calendarView.insufficientCapacityForCurrent"),
    }
  })

  const handleSelectRoom = async (
    targetRoomId: string,
    occupyingProposal?: Proposal | null
  ) => {
    if (isPending) return
    setSelectedRoomId(targetRoomId)
    try {
      await onSwitchRoom(proposal, targetRoomId, occupyingProposal ?? undefined)
      onOpenChange(false)
    } finally {
      setSelectedRoomId(null)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        data-testid="switch-room-dialog"
        className="max-w-lg overflow-hidden p-0 sm:max-w-lg"
      >
        <ResponsiveDialogHeader className="flex flex-row items-center justify-between border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <ResponsiveDialogTitle className="text-base font-semibold">
            {t("calendarView.switchRoomTitle")} · {proposal.course.title}
          </ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Current session info banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-foreground">
              <DoorOpen
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="font-semibold">
                {t("calendarView.currentRoomBadge")}:
              </span>
              <span>{proposal.classroom?.name ?? t("location")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users aria-hidden className="size-3.5 shrink-0" />
              <span>
                {formatNumber(currentStudents, locale)} نفر
                {proposal.classroom?.capacity && (
                  <span>
                    {" "}
                    / ظرفیت {formatNumber(proposal.classroom.capacity, locale)}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* List of available rooms */}
          <div className="space-y-2">
            {roomItems.map(
              ({
                room,
                isCurrent,
                type,
                isClickable,
                occupyingProposal,
                disabledReason,
              }) => {
                const isSelectedPending =
                  isPending && selectedRoomId === room.id

                return (
                  <div
                    key={room.id}
                    data-testid={`room-item-${room.id}`}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border p-3 transition-all",
                      isCurrent
                        ? "border-primary/40 bg-primary/5"
                        : type === "FREE"
                          ? "border-border/60 bg-card hover:border-success/60 hover:bg-success/5"
                          : type === "SWAPPABLE"
                            ? "border-border/60 bg-card hover:border-primary/60 hover:bg-primary/5"
                            : "border-border/40 bg-muted/20 opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <DoorOpen
                          aria-hidden
                          className={cn(
                            "size-4 shrink-0",
                            isCurrent
                              ? "text-primary"
                              : type === "FREE"
                                ? "text-success"
                                : "text-muted-foreground"
                          )}
                        />
                        <span className="font-semibold text-foreground">
                          {room.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-normal"
                        >
                          ظرفیت {formatNumber(room.capacity, locale)} نفر
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            {t("calendarView.currentRoomBadge")}
                          </Badge>
                        )}
                        {type === "FREE" && (
                          <Badge variant="success" className="text-xs">
                            {t("calendarView.freeRoom")}
                          </Badge>
                        )}
                        {type === "SWAPPABLE" && (
                          <Badge variant="default" className="gap-1 text-xs">
                            <ArrowLeftRight aria-hidden className="size-3" />
                            {t("calendarView.swappableRoom")}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Occupying proposal information */}
                    {occupyingProposal && (
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                        <span>
                          {t("calendarView.occupiedBy", {
                            title:
                              occupyingProposal.course?.title ??
                              occupyingProposal.title,
                            count: formatNumber(
                              occupyingProposal.capacity,
                              locale
                            ),
                          })}
                        </span>
                      </div>
                    )}

                    {/* Disabled reason hint */}
                    {disabledReason && (
                      <p className="text-[11px] text-destructive">
                        {disabledReason}
                      </p>
                    )}

                    {/* Action button */}
                    {!isCurrent && (
                      <div className="mt-1 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          data-testid={`switch-room-btn-${room.id}`}
                          variant={type === "FREE" ? "default" : "outline"}
                          disabled={!isClickable || isPending}
                          onClick={() =>
                            handleSelectRoom(room.id, occupyingProposal)
                          }
                          className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                        >
                          {isSelectedPending ? (
                            <Spinner className="size-3.5" />
                          ) : type === "SWAPPABLE" ? (
                            <>
                              <ArrowLeftRight
                                aria-hidden
                                className="size-3.5"
                              />
                              <span>جابه‌جایی با این کلاس</span>
                            </>
                          ) : (
                            <>
                              <Check aria-hidden className="size-3.5" />
                              <span>انتخاب این کلاس</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              }
            )}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
