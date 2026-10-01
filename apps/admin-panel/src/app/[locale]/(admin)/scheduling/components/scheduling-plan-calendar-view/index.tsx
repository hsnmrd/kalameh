"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  CalendarRange,
  CalendarX2,
  ChevronDown,
  ChevronsUpDown,
  Clock3,
  Highlighter,
  Info,
  Plus,
  UserCheck,
} from "lucide-react"
import {
  findHigherLevelCourse,
  summarizeCourseLevelRange,
  type SchedulingNewTeacherHiringAssignment,
  type SchedulingNewTeacherHiringPlan,
  type SchedulingNewTeacherHiringSlotOption,
  type SchedulingPlanDetailsDto,
  type SchedulingTeacherCalendar,
  type WeekDay,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingPlanCalendarClassCard } from "../scheduling-plan-calendar-class-card"
import { SchedulingPlanCalendarFreeTeacherCard } from "../scheduling-plan-calendar-free-teacher-card"
import { SchedulingPlanCalendarMissedClassCard } from "../scheduling-plan-calendar-missed-class-card"
import {
  AssignSlotDialog,
  type CurrentAssignmentState,
  type TargetSlotInfo,
} from "./assign-slot-dialog"
import {
  evaluateFreeTeacherSwap,
  evaluateProposalSwap,
  type FreeTeacherSwapTarget,
  type OccupiedClassroomSlot,
  type SwapEvaluationResult,
  type SwapTarget,
} from "./helper/swap-eligibility.helper"
import { SwapClassDialog } from "./swap-class-dialog"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export type DayTrack = "EVEN" | "ODD"
export const DAY_TRACKS: readonly DayTrack[] = ["EVEN", "ODD"] as const
export const EVEN_DAYS: readonly WeekDay[] = [
  "SATURDAY",
  "MONDAY",
  "WEDNESDAY",
] as const
export const ODD_DAYS: readonly WeekDay[] = [
  "SUNDAY",
  "TUESDAY",
  "THURSDAY",
] as const

export function getDaysOfWeekTracks(
  days: readonly (WeekDay | string)[]
): DayTrack[] {
  const tracks: DayTrack[] = []
  if (days.some((d) => EVEN_DAYS.includes(d as WeekDay))) {
    tracks.push("EVEN")
  }
  if (days.some((d) => ODD_DAYS.includes(d as WeekDay))) {
    tracks.push("ODD")
  }
  return tracks
}

export const ORDERED_WEEK_DAYS = [
  "SATURDAY",
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
] as const

interface TimeSlot {
  startTime: string
  endTime: string
  key: string
}

export interface SchedulingPlanCalendarViewProps {
  proposals: Proposal[]
  canEdit: boolean
  canSwap?: boolean
  hiringPlan?: SchedulingNewTeacherHiringPlan | null
  missedClassesAssignments?: Record<string, CurrentAssignmentState>
  onAssignMissedClass?: (assignmentKey: string, slotKey: string) => void
  onUnassignMissedClass?: (assignmentKey: string) => void
  onUpdateMissedClassesAssignments?: (
    updates: Record<string, CurrentAssignmentState>
  ) => void
  teacherCalendars?: SchedulingTeacherCalendar[]
  defaultShowFreeTeachers?: boolean
  defaultCollapsed?: boolean
  initialExpandedSlots?: string[]
}

export function SchedulingPlanCalendarView({
  proposals: incomingProposals,
  canEdit,
  canSwap = true,
  hiringPlan,
  missedClassesAssignments: incomingMissedClassesAssignments,
  onAssignMissedClass,
  onUnassignMissedClass,
  onUpdateMissedClassesAssignments,
  teacherCalendars,
  defaultShowFreeTeachers = false,
  defaultCollapsed = true,
  initialExpandedSlots,
}: SchedulingPlanCalendarViewProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const [proposalOverrides, setProposalOverrides] = React.useState<{
    byId: Record<string, Proposal>
  }>({ byId: {} })

  const proposals = React.useMemo(() => {
    if (Object.keys(proposalOverrides.byId).length === 0)
      return incomingProposals
    return incomingProposals.map((p) => proposalOverrides.byId[p.id] ?? p)
  }, [incomingProposals, proposalOverrides.byId])

  const [missedAssignmentOverrides, setMissedAssignmentOverrides] =
    React.useState<{
      byKey: Record<string, CurrentAssignmentState>
    }>({ byKey: {} })

  const missedClassesAssignments = React.useMemo(() => {
    if (!incomingMissedClassesAssignments) return undefined
    if (Object.keys(missedAssignmentOverrides.byKey).length === 0) {
      return incomingMissedClassesAssignments
    }
    return {
      ...incomingMissedClassesAssignments,
      ...missedAssignmentOverrides.byKey,
    }
  }, [incomingMissedClassesAssignments, missedAssignmentOverrides.byKey])

  const [assignSlotTarget, setAssignSlotTarget] =
    React.useState<TargetSlotInfo | null>(null)
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(
    null
  )
  const [swapDialogState, setSwapDialogState] = React.useState<{
    sourceProposal: Proposal
    target: SwapTarget
    evaluation: SwapEvaluationResult
  } | null>(null)
  const [showFreeTeachers, setShowFreeTeachers] = React.useState(
    defaultShowFreeTeachers
  )
  const [highlightRelated, setHighlightRelated] = React.useState(true)
  const [mobileTrack, setMobileTrack] = React.useState<DayTrack>("EVEN")
  const [userExpandedSlots, setUserExpandedSlots] =
    React.useState<Set<string> | null>(() => {
      if (initialExpandedSlots) return new Set(initialExpandedSlots)
      return null
    })

  const activeClassId = selectedClassId
  const isAnyClassActive = activeClassId !== null

  const knownClassroomsById = React.useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; capacity: number }
    >()
    for (const proposal of proposals) {
      if (proposal.classroom?.id) {
        map.set(proposal.classroom.id, {
          id: proposal.classroom.id,
          name: proposal.classroom.name,
          capacity: proposal.classroom.capacity,
        })
      }
    }
    for (const assignment of hiringPlan?.assignments ?? []) {
      if (assignment.classroom?.id && !map.has(assignment.classroom.id)) {
        map.set(assignment.classroom.id, {
          id: assignment.classroom.id,
          name: assignment.classroom.name,
          capacity: assignment.classroom.capacity ?? 999,
        })
      }
    }
    for (const slot of hiringPlan?.availableTimeSlots ?? []) {
      for (const room of slot.availableClassrooms) {
        if (!map.has(room.id)) {
          map.set(room.id, {
            id: room.id,
            name: room.name,
            capacity: room.capacity,
          })
        }
      }
    }
    return map
  }, [proposals, hiringPlan])

  const slotOptionsByTrackAndSlot = React.useMemo(() => {
    const map = new Map<string, SchedulingNewTeacherHiringSlotOption>()
    if (!hiringPlan?.availableTimeSlots) return map
    for (const opt of hiringPlan.availableTimeSlots) {
      const tracks = getDaysOfWeekTracks(opt.daysOfWeek)
      for (const track of tracks) {
        map.set(`${track}-${opt.startTime}-${opt.endTime}`, opt)
      }
    }
    return map
  }, [hiringPlan])

  const canPlaceMissedClassOnDay = React.useCallback(
    (
      assignment: SchedulingNewTeacherHiringAssignment,
      state: CurrentAssignmentState,
      day: WeekDay
    ): boolean => {
      if (assignment.deliveryMode !== "IN_PERSON") return true
      const effectiveRoomId =
        state.classroomId ?? assignment.classroom?.id ?? null
      if (!effectiveRoomId) return false

      const hasRoomConflictWithProposal = proposals.some(
        (proposal) =>
          proposal.classroom?.id === effectiveRoomId &&
          proposal.daysOfWeek.includes(day) &&
          proposal.startTime < state.endTime &&
          state.startTime < proposal.endTime
      )
      return !hasRoomConflictWithProposal
    },
    [proposals]
  )

  const canPlaceMissedClassOnTrack = React.useCallback(
    (
      assignment: SchedulingNewTeacherHiringAssignment,
      state: CurrentAssignmentState,
      track: DayTrack
    ): boolean => {
      const trackDays = track === "EVEN" ? EVEN_DAYS : ODD_DAYS
      const applicableDays = state.daysOfWeek.filter((d) =>
        trackDays.includes(d)
      )
      if (applicableDays.length === 0) return false
      return applicableDays.every((day) =>
        canPlaceMissedClassOnDay(assignment, state, day)
      )
    },
    [canPlaceMissedClassOnDay]
  )

  const missedClassProposals = React.useMemo<Proposal[]>(() => {
    if (!hiringPlan?.assignments || !missedClassesAssignments) return []
    const fallbackPlanId = proposals[0]?.planId ?? "plan-missed"
    const fallbackInstituteId = proposals[0]?.instituteId ?? "inst-missed"
    const list: Proposal[] = []

    for (const assignment of hiringPlan.assignments) {
      const state = missedClassesAssignments[assignment.key]
      if (!state || state.isAssigned === false || !state.daysOfWeek.length) {
        continue
      }
      const placableDays = state.daysOfWeek.filter((day) =>
        canPlaceMissedClassOnDay(assignment, state, day)
      )
      if (placableDays.length === 0) continue

      const effectiveRoomId =
        state.classroomId ?? assignment.classroom?.id ?? null
      const effectiveRoomName =
        state.classroomName ?? assignment.classroom?.name ?? null
      const knownRoom = effectiveRoomId
        ? knownClassroomsById.get(effectiveRoomId)
        : undefined

      const classroomObj =
        assignment.deliveryMode === "IN_PERSON" && effectiveRoomId
          ? {
              id: effectiveRoomId,
              name: effectiveRoomName ?? knownRoom?.name ?? "",
              capacity:
                knownRoom?.capacity ?? assignment.classroom?.capacity ?? 999,
            }
          : null

      list.push({
        id: `missed:${assignment.key}`,
        planId: fallbackPlanId,
        instituteId: fallbackInstituteId,
        title: assignment.course.title,
        course: assignment.course,
        teacher: null,
        teacherId: null,
        branch: null,
        branchId: null,
        classroom: classroomObj,
        classroomId: classroomObj?.id ?? null,
        capacity: 1,
        daysOfWeek: placableDays,
        startTime: state.startTime,
        endTime: state.endTime,
        deliveryMode: assignment.deliveryMode,
        isLocked: false,
        isManuallyEdited: false,
        warnings: [],
        scoreBreakdown: [],
      } as unknown as Proposal)
    }
    return list
  }, [
    hiringPlan,
    missedClassesAssignments,
    proposals,
    canPlaceMissedClassOnDay,
    knownClassroomsById,
  ])

  const allSwappableProposals = React.useMemo(
    () => [...proposals, ...missedClassProposals],
    [proposals, missedClassProposals]
  )

  const activeProposal = React.useMemo(
    () =>
      activeClassId
        ? (allSwappableProposals.find((p) => p.id === activeClassId) ?? null)
        : null,
    [activeClassId, allSwappableProposals]
  )

  const activeTeacherId = React.useMemo(() => {
    if (!activeProposal) return null
    return activeProposal.teacherId ?? activeProposal.teacher?.id ?? null
  }, [activeProposal])

  const activeCourseId = activeProposal?.course?.id ?? null
  const activeCourseTitle = activeProposal?.course?.title ?? null

  const sameTeacherTotalCount = React.useMemo(() => {
    if (!activeTeacherId) return 0
    return proposals.filter(
      (p) => (p.teacherId ?? p.teacher?.id) === activeTeacherId
    ).length
  }, [activeTeacherId, proposals])

  const sameCourseTotalCount = React.useMemo(() => {
    if (!activeProposal) return 0
    return allSwappableProposals.filter((p) => {
      if (activeCourseId && p.course?.id === activeCourseId) return true
      if (activeCourseTitle && p.course?.title === activeCourseTitle)
        return true
      return false
    }).length
  }, [activeProposal, activeCourseId, activeCourseTitle, allSwappableProposals])

  const occupiedClassroomSlots = React.useMemo<OccupiedClassroomSlot[]>(() => {
    if (!hiringPlan?.assignments || !missedClassesAssignments) return []
    const slots: OccupiedClassroomSlot[] = []
    for (const assignment of hiringPlan.assignments) {
      if (assignment.deliveryMode !== "IN_PERSON") continue
      const state = missedClassesAssignments[assignment.key]
      if (!state || state.isAssigned === false || !state.daysOfWeek.length) {
        continue
      }
      const effectiveRoomId =
        state.classroomId ?? assignment.classroom?.id ?? null
      if (!effectiveRoomId || !state.startTime || !state.endTime) continue
      slots.push({
        id: `missed:${assignment.key}`,
        classroomId: effectiveRoomId,
        daysOfWeek: [...state.daysOfWeek],
        startTime: state.startTime,
        endTime: state.endTime,
      })
    }
    return slots
  }, [hiringPlan, missedClassesAssignments])

  const swappableByProposalId = React.useMemo(() => {
    const map = new Map<string, SwapEvaluationResult>()
    if (!canSwap || !activeProposal) return map
    for (const proposal of allSwappableProposals) {
      if (proposal.id === activeProposal.id) continue
      const evaluation = evaluateProposalSwap(
        activeProposal,
        proposal,
        allSwappableProposals,
        teacherCalendars,
        occupiedClassroomSlots
      )
      if (evaluation.canSwap) {
        map.set(proposal.id, evaluation)
      }
    }
    return map
  }, [
    canSwap,
    activeProposal,
    allSwappableProposals,
    teacherCalendars,
    occupiedClassroomSlots,
  ])

  const handleCardClick = React.useCallback(
    (id: string) => {
      if (activeProposal && id !== activeProposal.id) {
        const swapEvaluation = swappableByProposalId.get(id)
        const targetProposal = allSwappableProposals.find((p) => p.id === id)
        if (swapEvaluation && targetProposal) {
          setSwapDialogState({
            sourceProposal: activeProposal,
            target: { kind: "PROPOSAL", proposal: targetProposal },
            evaluation: swapEvaluation,
          })
          return
        }
      }
      setSelectedClassId((prev) => (prev === id ? null : id))
    },
    [activeProposal, allSwappableProposals, swappableByProposalId]
  )

  const handleSwapSuccess = React.useCallback(
    (updatedProposals: Proposal[]) => {
      const realProposals = updatedProposals.filter(
        (p) => !p.id.startsWith("missed:")
      )
      const missedProposals = updatedProposals.filter((p) =>
        p.id.startsWith("missed:")
      )

      if (realProposals.length > 0) {
        setProposalOverrides((prev) => {
          const nextById = { ...prev.byId }
          for (const p of realProposals) {
            nextById[p.id] = p
          }
          return { byId: nextById }
        })
      }

      if (missedProposals.length > 0) {
        const missedUpdates: Record<string, CurrentAssignmentState> = {}
        for (const p of missedProposals) {
          const assignmentKey = p.id.slice("missed:".length)
          missedUpdates[assignmentKey] = {
            daysOfWeek: [...p.daysOfWeek],
            startTime: p.startTime,
            endTime: p.endTime,
            classroomId: p.classroom?.id ?? p.classroomId ?? null,
            classroomName: p.classroom?.name ?? null,
            isAssigned: true,
          }
        }
        setMissedAssignmentOverrides((prev) => ({
          byKey: {
            ...prev.byKey,
            ...missedUpdates,
          },
        }))
        onUpdateMissedClassesAssignments?.(missedUpdates)
      }

      setSwapDialogState(null)
      setSelectedClassId(null)
    },
    [onUpdateMissedClassesAssignments]
  )

  // Clear selected class on Escape key when no modal dialog is open
  React.useEffect(() => {
    if (!selectedClassId || swapDialogState || assignSlotTarget) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedClassId(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedClassId, swapDialogState, assignSlotTarget])

  const timeSlots = React.useMemo<TimeSlot[]>(() => {
    const slotsMap = new Map<string, TimeSlot>()
    for (const proposal of proposals) {
      const key = `${proposal.startTime}-${proposal.endTime}`
      if (!slotsMap.has(key)) {
        slotsMap.set(key, {
          startTime: proposal.startTime,
          endTime: proposal.endTime,
          key,
        })
      }
    }
    if (hiringPlan?.availableTimeSlots) {
      for (const slot of hiringPlan.availableTimeSlots) {
        const key = `${slot.startTime}-${slot.endTime}`
        if (!slotsMap.has(key)) {
          slotsMap.set(key, {
            startTime: slot.startTime,
            endTime: slot.endTime,
            key,
          })
        }
      }
    }
    if (missedClassesAssignments) {
      for (const item of Object.values(missedClassesAssignments)) {
        if (item.isAssigned !== false && item.startTime && item.endTime) {
          const key = `${item.startTime}-${item.endTime}`
          if (!slotsMap.has(key)) {
            slotsMap.set(key, {
              startTime: item.startTime,
              endTime: item.endTime,
              key,
            })
          }
        }
      }
    }
    if (showFreeTeachers && teacherCalendars) {
      const baseSlots = Array.from(slotsMap.values())
      for (const calendar of teacherCalendars) {
        for (const slot of calendar.slots) {
          if (
            slot.status === "FREE" &&
            (ORDERED_WEEK_DAYS as readonly string[]).includes(slot.dayOfWeek)
          ) {
            const key = `${slot.startTime}-${slot.endTime}`
            const overlapsBaseSlot = baseSlots.some(
              (base) =>
                base.startTime < slot.endTime && slot.startTime < base.endTime
            )
            if (!overlapsBaseSlot && !slotsMap.has(key)) {
              slotsMap.set(key, {
                startTime: slot.startTime,
                endTime: slot.endTime,
                key,
              })
            }
          }
        }
      }
    }
    return Array.from(slotsMap.values()).sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime) ||
        a.endTime.localeCompare(b.endTime)
    )
  }, [
    proposals,
    hiringPlan,
    missedClassesAssignments,
    showFreeTeachers,
    teacherCalendars,
  ])

  const freeTeachersByTrackAndSlot = React.useMemo(() => {
    const map = new Map<
      string,
      Array<{
        teacher: SchedulingTeacherCalendar["teacher"]
        teachableCourses: SchedulingTeacherCalendar["teachableCourses"]
        levelRange: string | null
        representativeDay: WeekDay
      }>
    >()
    if (!teacherCalendars?.length) return map

    for (const slot of timeSlots) {
      for (const track of DAY_TRACKS) {
        const trackDays = track === "EVEN" ? EVEN_DAYS : ODD_DAYS
        const representativeDay: WeekDay =
          track === "EVEN" ? "SATURDAY" : "SUNDAY"
        const key = `${track}-${slot.startTime}-${slot.endTime}`
        const freeTeachers: Array<{
          teacher: SchedulingTeacherCalendar["teacher"]
          teachableCourses: SchedulingTeacherCalendar["teachableCourses"]
          levelRange: string | null
          representativeDay: WeekDay
        }> = []

        for (const calendar of teacherCalendars) {
          const isFreeInPeriod = calendar.slots.some(
            (s) =>
              s.status === "FREE" &&
              trackDays.includes(s.dayOfWeek) &&
              s.startTime <= slot.startTime &&
              s.endTime >= slot.endTime
          )
          if (isFreeInPeriod) {
            const teachableCourses = calendar.teachableCourses ?? []
            freeTeachers.push({
              teacher: calendar.teacher,
              teachableCourses,
              levelRange: summarizeCourseLevelRange(teachableCourses),
              representativeDay,
            })
          }
        }
        if (freeTeachers.length > 0) {
          map.set(key, freeTeachers)
        }
      }
    }
    return map
  }, [teacherCalendars, timeSlots])

  const expandedSlots = React.useMemo(() => {
    if (userExpandedSlots !== null) return userExpandedSlots
    if (!defaultCollapsed) {
      return new Set(timeSlots.map((s) => s.key))
    }
    return new Set<string>()
  }, [userExpandedSlots, defaultCollapsed, timeSlots])

  const areAllExpanded =
    timeSlots.length > 0 && expandedSlots.size >= timeSlots.length

  const toggleSlotCollapse = React.useCallback(
    (slotKey: string) => {
      setUserExpandedSlots((prev) => {
        const current =
          prev !== null
            ? prev
            : !defaultCollapsed
              ? new Set(timeSlots.map((s) => s.key))
              : new Set<string>()
        const next = new Set(current)
        if (next.has(slotKey)) {
          next.delete(slotKey)
        } else {
          next.add(slotKey)
        }
        return next
      })
    },
    [defaultCollapsed, timeSlots]
  )

  const handleExpandAll = React.useCallback(() => {
    setUserExpandedSlots(new Set(timeSlots.map((s) => s.key)))
  }, [timeSlots])

  const handleCollapseAll = React.useCallback(() => {
    setUserExpandedSlots(new Set())
  }, [])

  const proposalsByTrackAndSlot = React.useMemo(() => {
    const map = new Map<string, Proposal[]>()
    for (const proposal of proposals) {
      const tracks = getDaysOfWeekTracks(proposal.daysOfWeek)
      for (const track of tracks) {
        const key = `${track}-${proposal.startTime}-${proposal.endTime}`
        const existing = map.get(key)
        if (existing) {
          existing.push(proposal)
        } else {
          map.set(key, [proposal])
        }
      }
    }
    return map
  }, [proposals])

  const proposalColorMap = React.useMemo(() => {
    const map = new Map<string, number>()
    let counter = 0
    for (const proposal of proposals) {
      if (!map.has(proposal.id)) {
        map.set(proposal.id, counter)
        counter++
      }
    }
    return map
  }, [proposals])

  const missedClassesByTrackAndSlot = React.useMemo(() => {
    const map = new Map<
      string,
      Array<{
        assignment: SchedulingNewTeacherHiringAssignment
        state: CurrentAssignmentState
      }>
    >()
    if (!hiringPlan?.assignments || !missedClassesAssignments) return map

    for (const assignment of hiringPlan.assignments) {
      const state = missedClassesAssignments[assignment.key]
      if (!state || state.isAssigned === false || !state.daysOfWeek.length) {
        continue
      }
      const tracks = getDaysOfWeekTracks(state.daysOfWeek)
      for (const track of tracks) {
        if (!canPlaceMissedClassOnTrack(assignment, state, track)) continue
        const key = `${track}-${state.startTime}-${state.endTime}`
        const existing = map.get(key)
        if (existing) {
          existing.push({ assignment, state })
        } else {
          map.set(key, [{ assignment, state }])
        }
      }
    }
    return map
  }, [hiringPlan, missedClassesAssignments, canPlaceMissedClassOnTrack])

  const proposalsByTrack = React.useMemo(() => {
    const map: Record<DayTrack, Proposal[]> = {
      EVEN: [],
      ODD: [],
    }
    for (const proposal of proposals) {
      const tracks = getDaysOfWeekTracks(proposal.daysOfWeek)
      for (const track of tracks) {
        map[track].push(proposal)
      }
    }
    return map
  }, [proposals])

  const missedClassesByTrack = React.useMemo(() => {
    const map: Record<DayTrack, number> = {
      EVEN: 0,
      ODD: 0,
    }
    if (!hiringPlan?.assignments || !missedClassesAssignments) return map
    for (const assignment of hiringPlan.assignments) {
      const state = missedClassesAssignments[assignment.key]
      if (!state || state.isAssigned === false || !state.daysOfWeek.length) {
        continue
      }
      const tracks = getDaysOfWeekTracks(state.daysOfWeek)
      for (const track of tracks) {
        if (!canPlaceMissedClassOnTrack(assignment, state, track)) continue
        map[track] += 1
      }
    }
    return map
  }, [hiringPlan, missedClassesAssignments, canPlaceMissedClassOnTrack])

  const getFreeClassrooms = React.useCallback(
    (option: SchedulingNewTeacherHiringSlotOption) => {
      if (option.isFullyBooked) return []
      const takenRoomIds = new Set<string>()
      for (const proposal of proposals) {
        if (
          proposal.classroom?.id &&
          proposal.daysOfWeek.some((day) =>
            option.daysOfWeek.includes(day as WeekDay)
          ) &&
          proposal.startTime < option.endTime &&
          option.startTime < proposal.endTime
        ) {
          takenRoomIds.add(proposal.classroom.id)
        }
      }
      if (missedClassesAssignments) {
        for (const state of Object.values(missedClassesAssignments)) {
          if (state.isAssigned === false || !state.daysOfWeek.length) continue
          const overlapsDay = state.daysOfWeek.some((day) =>
            option.daysOfWeek.includes(day)
          )
          const overlapsTime =
            state.startTime < option.endTime && option.startTime < state.endTime
          if (overlapsDay && overlapsTime && state.classroomId) {
            takenRoomIds.add(state.classroomId)
          }
        }
      }
      return option.availableClassrooms.filter(
        (room) => !takenRoomIds.has(room.id)
      )
    },
    [missedClassesAssignments, proposals]
  )

  const handleOpenAssignDialog = (
    option: SchedulingNewTeacherHiringSlotOption,
    freeRooms: Array<{ id: string; name: string }>
  ) => {
    setAssignSlotTarget({
      daysOfWeek: option.daysOfWeek,
      startTime: option.startTime,
      endTime: option.endTime,
      availableClassroomName: freeRooms[0]?.name ?? null,
      availableRoomsCount: freeRooms.length,
    })
  }

  const hasProposals = proposals.length > 0
  const hasMissedClasses = Boolean(
    hiringPlan?.assignments && hiringPlan.assignments.length > 0
  )

  if (!hasProposals && !hasMissedClasses) {
    return (
      <Empty variant="compact" className="mt-4 bg-muted/30">
        <EmptyMedia>
          <CalendarRange aria-hidden />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{t("noProposals.title")}</EmptyTitle>
          <EmptyDescription>{t("noProposals.description")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div
        className="flex flex-col gap-4"
        onClick={(e) => {
          if (swapDialogState || assignSlotTarget) return
          if (!e.currentTarget.contains(e.target as Node)) return
          if (selectedClassId) {
            setSelectedClassId(null)
          }
        }}
      >
        {/* Informational Subtitle & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Info
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span>{t("calendarView.allInOneNotice")}</span>
            {selectedClassId && activeProposal && (
              <div
                data-testid="selected-class-match-summary"
                className="flex flex-wrap items-center gap-1.5 font-medium text-foreground"
              >
                <span className="text-muted-foreground">·</span>
                <span
                  data-testid="same-course-count-chip"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                >
                  <span
                    className="inline-block size-2 shrink-0 rounded-xs bg-[#ffff00]"
                    aria-hidden="true"
                  />
                  {t("calendarView.sameCourseCountBadge", {
                    count: formatNumber(sameCourseTotalCount, locale),
                  })}
                </span>
                {activeTeacherId && (
                  <span
                    data-testid="same-teacher-count-chip"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    <span
                      className="inline-block size-2 shrink-0 rounded-xs bg-[#67e8f9]"
                      aria-hidden="true"
                    />
                    {t("calendarView.sameTeacherCountBadge", {
                      count: formatNumber(sameTeacherTotalCount, locale),
                    })}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedClassId && (
              <Button
                type="button"
                variant="link"
                size="xs"
                data-testid="clear-selection-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedClassId(null)
                }}
                className="h-auto p-0 text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t("calendarView.clearSelection")}
              </Button>
            )}
            {hasMissedClasses && (
              <div className="flex items-center gap-1.5 font-semibold text-warning-foreground">
                <span className="inline-block size-2 rounded-full bg-warning" />
                <span>{t("calendarView.newTeacherBadge")}</span>
              </div>
            )}
            {timeSlots.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  data-testid="toggle-highlight-matches-btn"
                  aria-pressed={highlightRelated}
                  onClick={(e) => {
                    e.stopPropagation()
                    setHighlightRelated((prev) => !prev)
                  }}
                  className={cn(
                    "h-6 gap-1 rounded-lg px-2 text-xs font-medium",
                    highlightRelated &&
                      "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                  )}
                >
                  <Highlighter aria-hidden className="size-3" />
                  <span>{t("calendarView.highlightMatches")}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  data-testid="toggle-free-teachers-btn"
                  aria-pressed={showFreeTeachers}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowFreeTeachers((prev) => !prev)
                  }}
                  className={cn(
                    "h-6 gap-1 rounded-lg px-2 text-xs font-medium",
                    showFreeTeachers &&
                      "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                  )}
                >
                  <UserCheck aria-hidden className="size-3" />
                  <span>{t("calendarView.showFreeTeachers")}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  data-testid="toggle-collapse-all-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (areAllExpanded) {
                      handleCollapseAll()
                    } else {
                      handleExpandAll()
                    }
                  }}
                  className="h-6 gap-1 rounded-lg px-2 text-xs font-medium"
                >
                  <ChevronsUpDown aria-hidden className="size-3" />
                  <span>
                    {areAllExpanded
                      ? t("calendarView.collapseAll")
                      : t("calendarView.expandAll")}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Day Track Switcher (visible on mobile, hidden on md+) */}
        <div
          role="tablist"
          aria-label={t("calendarView.mobileTrackAria")}
          className="flex w-full rounded-xl bg-muted/60 p-1 md:hidden"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileTrack === "EVEN"}
            data-testid="mobile-track-even-btn"
            onClick={() => setMobileTrack("EVEN")}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-center transition-all",
              mobileTrack === "EVEN"
                ? "bg-card font-bold text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">
                {t("calendarView.evenDays")}
              </span>
              <Badge
                variant={mobileTrack === "EVEN" ? "secondary" : "outline"}
                className="h-4 px-1 py-0 text-[9px]"
              >
                {formatNumber(
                  (proposalsByTrack.EVEN?.length ?? 0) +
                    (missedClassesByTrack.EVEN ?? 0),
                  locale
                )}
              </Badge>
            </div>
            <span className="text-[10px] opacity-80">
              {t("calendarView.evenDaysSubtitle")}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTrack === "ODD"}
            data-testid="mobile-track-odd-btn"
            onClick={() => setMobileTrack("ODD")}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-center transition-all",
              mobileTrack === "ODD"
                ? "bg-card font-bold text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">
                {t("calendarView.oddDays")}
              </span>
              <Badge
                variant={mobileTrack === "ODD" ? "secondary" : "outline"}
                className="h-4 px-1 py-0 text-[9px]"
              >
                {formatNumber(
                  (proposalsByTrack.ODD?.length ?? 0) +
                    (missedClassesByTrack.ODD ?? 0),
                  locale
                )}
              </Badge>
            </div>
            <span className="text-[10px] opacity-80">
              {t("calendarView.oddDaysSubtitle")}
            </span>
          </button>
        </div>

        {/* Day Track Column Headers (Even & Odd Days Overview Bar) */}
        <div className="grid grid-cols-[80px_1fr] items-center gap-2.5 rounded-2xl border border-border/80 bg-muted/50 p-2.5 shadow-2xs backdrop-blur-md md:grid-cols-[96px_1fr_1fr]">
          {/* Time Column Header */}
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
            <Clock3 aria-hidden className="size-3.5 text-muted-foreground" />
            <span>{t("calendarView.timeColumn")}</span>
          </div>

          {/* Day Track Column Headers (Even & Odd Days) */}
          {DAY_TRACKS.map((track) => {
            const trackProposalsCount =
              (proposalsByTrack[track]?.length ?? 0) +
              (missedClassesByTrack[track] ?? 0)
            const isTrackEmpty = trackProposalsCount === 0

            return (
              <div
                key={track}
                data-day-header={track}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 p-1 text-center transition-opacity",
                  track !== mobileTrack && "hidden md:flex",
                  isTrackEmpty && "opacity-50"
                )}
              >
                <span className="text-xs font-bold text-foreground">
                  {track === "EVEN"
                    ? t("calendarView.evenDays")
                    : t("calendarView.oddDays")}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {track === "EVEN"
                    ? t("calendarView.evenDaysSubtitle")
                    : t("calendarView.oddDaysSubtitle")}
                </span>
                {trackProposalsCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 py-0 text-[10px]"
                  >
                    {t("calendarView.classesCount", {
                      count: formatNumber(trackProposalsCount, locale),
                    })}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="h-4 border-border/50 px-1.5 py-0 text-[10px] text-muted-foreground"
                  >
                    {t("calendarView.weekendOff")}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>

        {/* Hour-Grouped Time Slots (Modular Sections) */}
        <div className="flex flex-col gap-3">
          {timeSlots.map((slot) => {
            const isCollapsed = !expandedSlots.has(slot.key)

            return (
              <div
                key={slot.key}
                data-testid={`time-slot-row-${slot.key}`}
                className={cn(
                  "rounded-2xl border border-border/70 bg-card/40 p-2.5 shadow-2xs transition-all duration-300 hover:border-border hover:bg-card/70",
                  "grid grid-cols-[80px_1fr] items-stretch gap-2.5 md:grid-cols-[96px_1fr_1fr]"
                )}
              >
                {/* Time Column Cell */}
                <button
                  type="button"
                  onClick={() => toggleSlotCollapse(slot.key)}
                  data-testid={`time-slot-toggle-${slot.key}`}
                  className={cn(
                    "group flex h-full w-full cursor-pointer flex-col items-center overflow-hidden rounded-xl border border-border/50 bg-muted/30 px-1 text-center transition-[height,padding,background-color,border-color] duration-300 ease-in-out select-none hover:border-primary/40 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    isCollapsed
                      ? "min-h-[52px] justify-center gap-0.5 py-1"
                      : "min-h-[134px] justify-between py-2.5"
                  )}
                  aria-expanded={!isCollapsed}
                  aria-label={
                    isCollapsed
                      ? t("calendarView.expandSlot", {
                          time: `${slot.startTime} - ${slot.endTime}`,
                        })
                      : t("calendarView.collapseSlot", {
                          time: `${slot.startTime} - ${slot.endTime}`,
                        })
                  }
                >
                  {/* Top chevron indicator indicating clickable section */}
                  <div className="flex shrink-0 items-center justify-center pt-0.5">
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-3.5 text-muted-foreground/60 transition-transform duration-300 ease-in-out group-hover:text-foreground",
                        !isCollapsed && "rotate-180"
                      )}
                    />
                  </div>

                  {/* Prominent Hour Text */}
                  <div className="my-auto flex flex-col items-center justify-center text-center transition-all duration-300">
                    <span className="text-base leading-tight font-black tracking-tight text-foreground tabular-nums">
                      {slot.startTime}
                    </span>
                    <span
                      className={cn(
                        "overflow-hidden text-[10px] font-medium text-muted-foreground transition-[max-height,opacity] duration-300 ease-in-out",
                        isCollapsed
                          ? "max-h-0 opacity-0"
                          : "my-0.5 max-h-4 opacity-100"
                      )}
                    >
                      {t("calendarView.timeTo")}
                    </span>
                    <span className="text-xs leading-tight font-extrabold text-foreground tabular-nums">
                      {slot.endTime}
                    </span>
                  </div>

                  {/* Bottom balancing spacer for expanded view */}
                  {!isCollapsed && (
                    <div className="size-3.5 shrink-0" aria-hidden="true" />
                  )}
                </button>

                {/* Day Track Cells */}
                {DAY_TRACKS.map((track) => {
                  const cellKey = `${track}-${slot.startTime}-${slot.endTime}`
                  const cellProposals =
                    proposalsByTrackAndSlot.get(cellKey) ?? []
                  const cellMissed =
                    missedClassesByTrackAndSlot.get(cellKey) ?? []
                  const cellFreeTeachers =
                    freeTeachersByTrackAndSlot.get(cellKey) ?? []
                  const matchingOption = slotOptionsByTrackAndSlot.get(cellKey)
                  const freeRooms = matchingOption
                    ? getFreeClassrooms(matchingOption)
                    : []

                  const targetSlotKey = matchingOption
                    ? `${matchingOption.daysOfWeek.join(",")}|${matchingOption.startTime}|${matchingOption.endTime}`
                    : ""

                  const hasAssignableMissedClass = Boolean(
                    hiringPlan?.assignments.some((assignment) => {
                      if (
                        assignment.deliveryMode === "IN_PERSON" &&
                        (matchingOption?.isFullyBooked ||
                          freeRooms.length === 0)
                      ) {
                        return false
                      }
                      const state = missedClassesAssignments?.[assignment.key]
                      const isPlacedOnTrack =
                        state &&
                        state.isAssigned !== false &&
                        state.daysOfWeek.length > 0 &&
                        canPlaceMissedClassOnTrack(assignment, state, track)
                      if (!isPlacedOnTrack || !state) {
                        return true
                      }
                      const itemKey = `${state.daysOfWeek.join(",")}|${state.startTime}|${state.endTime}`
                      return itemKey !== targetSlotKey
                    })
                  )

                  const canAssignHere =
                    canEdit &&
                    Boolean(matchingOption) &&
                    !matchingOption?.isFullyBooked &&
                    hasAssignableMissedClass &&
                    (freeRooms.length > 0 ||
                      Boolean(
                        hiringPlan?.assignments.some(
                          (assignment) => assignment.deliveryMode === "ONLINE"
                        )
                      ))

                  const hasClasses =
                    cellProposals.length > 0 || cellMissed.length > 0

                  return (
                    <div
                      key={`${track}-${slot.key}`}
                      data-day={track}
                      data-slot={slot.key}
                      className={cn(
                        "flex flex-col transition-all duration-300 ease-in-out",
                        track !== mobileTrack && "hidden md:flex",
                        isCollapsed
                          ? "min-h-[52px] gap-1.5"
                          : "min-h-[134px] gap-2"
                      )}
                    >
                      {hasClasses ? (
                        <>
                          {cellProposals.map((proposal) => {
                            const isActive = activeClassId === proposal.id
                            const isSwappable = swappableByProposalId.has(
                              proposal.id
                            )
                            const propTeacherId =
                              proposal.teacherId ?? proposal.teacher?.id ?? null
                            const hasSameTeacher = Boolean(
                              highlightRelated &&
                              activeTeacherId &&
                              !isActive &&
                              propTeacherId === activeTeacherId
                            )
                            const hasSameCourse = Boolean(
                              highlightRelated &&
                              (activeCourseId || activeCourseTitle) &&
                              !isActive &&
                              ((activeCourseId &&
                                proposal.course?.id === activeCourseId) ||
                                (activeCourseTitle &&
                                  proposal.course?.title === activeCourseTitle))
                            )
                            const isDimmed =
                              isAnyClassActive && !isActive && !isSwappable

                            return (
                              <SchedulingPlanCalendarClassCard
                                key={`${proposal.id}-${track}`}
                                proposal={proposal}
                                canEdit={canEdit}
                                colorIndex={proposalColorMap.get(proposal.id)}
                                isActive={isActive}
                                isSwappable={isSwappable}
                                isDimmed={isDimmed}
                                isCollapsed={isCollapsed}
                                hasSameTeacher={hasSameTeacher}
                                hasSameCourse={hasSameCourse}
                                sameTeacherCount={
                                  isActive ? sameTeacherTotalCount : undefined
                                }
                                sameCourseCount={
                                  isActive ? sameCourseTotalCount : undefined
                                }
                                onClick={handleCardClick}
                              />
                            )
                          })}
                          {cellMissed.map(({ assignment, state }) => {
                            const missedKey = `missed:${assignment.key}`
                            const isActive = activeClassId === missedKey
                            const isSwappable =
                              swappableByProposalId.has(missedKey)
                            const hasSameCourse = Boolean(
                              highlightRelated &&
                              (activeCourseId || activeCourseTitle) &&
                              !isActive &&
                              ((activeCourseId &&
                                assignment.course?.id === activeCourseId) ||
                                (activeCourseTitle &&
                                  assignment.course?.title ===
                                    activeCourseTitle))
                            )
                            const isDimmed =
                              isAnyClassActive && !isActive && !isSwappable
                            const effectiveRoomId =
                              state.classroomId ??
                              assignment.classroom?.id ??
                              null
                            const roomCapacity = effectiveRoomId
                              ? (knownClassroomsById.get(effectiveRoomId)
                                  ?.capacity ??
                                assignment.classroom?.capacity ??
                                null)
                              : (assignment.classroom?.capacity ?? null)

                            return (
                              <SchedulingPlanCalendarMissedClassCard
                                key={`${assignment.key}-${track}`}
                                assignment={assignment}
                                assignedRoomName={
                                  state.classroomName ??
                                  (effectiveRoomId
                                    ? knownClassroomsById.get(effectiveRoomId)
                                        ?.name
                                    : null) ??
                                  assignment.classroom?.name ??
                                  null
                                }
                                assignedRoomCapacity={roomCapacity}
                                canEdit={canEdit}
                                isActive={isActive}
                                isSwappable={isSwappable}
                                isDimmed={isDimmed}
                                isCollapsed={isCollapsed}
                                hasSameCourse={hasSameCourse}
                                sameCourseCount={
                                  isActive ? sameCourseTotalCount : undefined
                                }
                                onClick={handleCardClick}
                                onUnassign={() =>
                                  onUnassignMissedClass?.(assignment.key)
                                }
                              />
                            )
                          })}
                          {canAssignHere && matchingOption && (
                            <Button
                              type="button"
                              variant="ghost"
                              size={isCollapsed ? "xs" : "sm"}
                              onClick={() =>
                                handleOpenAssignDialog(
                                  matchingOption,
                                  freeRooms
                                )
                              }
                              className={cn(
                                isCollapsed
                                  ? "h-6 w-full gap-1 rounded-md text-[10px]"
                                  : "h-7 w-full gap-1 rounded-lg text-[11px]",
                                "border border-dashed border-border/60 font-medium text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                                isAnyClassActive && "opacity-20"
                              )}
                            >
                              <Plus
                                className={isCollapsed ? "size-2.5" : "size-3"}
                              />
                              <span>{t("calendarView.assignClass")}</span>
                            </Button>
                          )}
                        </>
                      ) : canAssignHere && matchingOption ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            handleOpenAssignDialog(matchingOption, freeRooms)
                          }
                          className={cn(
                            "group w-full cursor-pointer overflow-hidden border-2 border-dashed border-primary/50 bg-primary/10 text-center transition-[height,padding,background-color,border-color] duration-300 ease-in-out hover:border-primary hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            isCollapsed
                              ? "h-[52px] flex-row gap-1.5 p-1.5 text-xs font-bold text-primary"
                              : "h-[134px] flex-col justify-center gap-2 p-3",
                            isAnyClassActive && "opacity-20"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center transition-all duration-300",
                              isCollapsed
                                ? "size-auto bg-transparent"
                                : "size-7 rounded-full bg-primary/20 text-primary group-hover:scale-110"
                            )}
                          >
                            <Plus
                              className={isCollapsed ? "size-3.5" : "size-4"}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs font-bold text-primary">
                              {t("calendarView.freeSlot")}
                            </span>
                            <span
                              className={cn(
                                "overflow-hidden text-[10px] font-medium text-muted-foreground transition-[max-height,opacity] duration-300 ease-in-out group-hover:text-primary",
                                isCollapsed
                                  ? "max-h-0 opacity-0"
                                  : "max-h-4 opacity-100"
                              )}
                            >
                              {t("calendarView.assignClass")}
                            </span>
                          </div>
                        </Button>
                      ) : (
                        <div
                          data-testid={`empty-cell-${track}-${slot.key}`}
                          className={cn(
                            "flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border/50 bg-muted/15 transition-[height,padding,opacity,background-color] duration-300 ease-in-out select-none hover:bg-muted/25",
                            isCollapsed
                              ? "h-[52px] py-1 text-center"
                              : "h-[134px] flex-col gap-2 p-3 text-center",
                            isAnyClassActive ? "opacity-20" : "opacity-40"
                          )}
                          aria-label={t("calendarView.noClasses")}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-in-out",
                              isCollapsed
                                ? "max-h-0 scale-75 opacity-0"
                                : "max-h-8 scale-100 opacity-100"
                            )}
                          >
                            <div className="flex size-7 items-center justify-center rounded-full bg-muted/30 text-muted-foreground/70">
                              <CalendarX2
                                aria-hidden
                                className="size-4 text-muted-foreground/70"
                              />
                            </div>
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground/80">
                            {t("calendarView.noClasses")}
                          </span>
                        </div>
                      )}
                      {showFreeTeachers && cellFreeTeachers.length > 0 && (
                        <div
                          data-testid={`free-teachers-${track}-${slot.key}`}
                          className={cn(
                            "flex flex-col transition-all duration-300 ease-in-out",
                            isCollapsed ? "gap-1.5" : "gap-2"
                          )}
                        >
                          {cellFreeTeachers.map(
                            ({
                              teacher,
                              teachableCourses,
                              levelRange,
                              representativeDay,
                            }) => {
                              const suggestedCourseTitle =
                                cellMissed.find(
                                  ({ assignment }) =>
                                    teachableCourses.some(
                                      (tc) => tc.id === assignment.course.id
                                    ) ||
                                    Boolean(
                                      findHigherLevelCourse(
                                        assignment.course,
                                        teachableCourses
                                      )
                                    )
                                )?.assignment.course.title ?? null

                              const freeTarget: FreeTeacherSwapTarget = {
                                kind: "FREE_TEACHER",
                                teacher,
                                teachableCourses,
                                levelRange,
                                dayOfWeek: representativeDay,
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                              }
                              const freeEvaluation =
                                canSwap && activeProposal
                                  ? evaluateFreeTeacherSwap(
                                      activeProposal,
                                      freeTarget,
                                      proposals,
                                      teacherCalendars,
                                      occupiedClassroomSlots
                                    )
                                  : null
                              const isFreeSwappable = Boolean(
                                freeEvaluation?.canSwap
                              )

                              return (
                                <SchedulingPlanCalendarFreeTeacherCard
                                  key={teacher.id}
                                  teacher={teacher}
                                  day={track}
                                  slotKey={slot.key}
                                  levelRange={levelRange}
                                  suggestedCourseTitle={suggestedCourseTitle}
                                  isCollapsed={isCollapsed}
                                  isSwappable={isFreeSwappable}
                                  isDimmed={
                                    isAnyClassActive && !isFreeSwappable
                                  }
                                  onClick={() => {
                                    if (
                                      activeProposal &&
                                      freeEvaluation?.canSwap
                                    ) {
                                      setSwapDialogState({
                                        sourceProposal: activeProposal,
                                        target: freeTarget,
                                        evaluation: freeEvaluation,
                                      })
                                    }
                                  }}
                                />
                              )
                            }
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Assign Missed Class to Slot Dialog */}
      <AssignSlotDialog
        open={Boolean(assignSlotTarget)}
        onOpenChange={(open) => {
          if (!open) setAssignSlotTarget(null)
        }}
        targetSlot={assignSlotTarget}
        assignments={hiringPlan?.assignments ?? []}
        assignmentsState={missedClassesAssignments ?? {}}
        onSelectAssignment={(assignmentKey) => {
          if (assignSlotTarget && onAssignMissedClass) {
            const slotKey = `${assignSlotTarget.daysOfWeek.join(",")}|${assignSlotTarget.startTime}|${assignSlotTarget.endTime}`
            onAssignMissedClass(assignmentKey, slotKey)
          }
        }}
      />

      {/* Swap Class Dialog */}
      <SwapClassDialog
        open={Boolean(swapDialogState)}
        onOpenChange={(open) => {
          if (!open) setSwapDialogState(null)
        }}
        sourceProposal={swapDialogState?.sourceProposal ?? null}
        target={swapDialogState?.target ?? null}
        evaluation={swapDialogState?.evaluation ?? null}
        onSwapSuccess={handleSwapSuccess}
      />
    </>
  )
}
