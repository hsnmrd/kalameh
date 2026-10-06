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
  X,
} from "lucide-react"
import {
  findHigherLevelCourse,
  summarizeCourseLevelRange,
  type SchedulingNewTeacherHiringAssignment,
  type SchedulingNewTeacherHiringPlan,
  type SchedulingNewTeacherHiringSlotOption,
  type SchedulingPlanDetailsDto,
  type SchedulingStaffingFallback as StaffingFallbackDto,
  type SchedulingTeacherCalendar,
  type UpdateSchedulingProposalInput,
  type WeekDay,
} from "@workspace/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingPlanCalendarClassCard } from "../scheduling-plan-calendar-class-card"
import {
  SchedulingPlanCalendarMoveTargetCard,
  type TargetRoomInfo,
} from "../scheduling-plan-calendar-move-target-card"
import { SchedulingPlanCalendarMissedClassCard } from "../scheduling-plan-calendar-missed-class-card"
import { StaffingFallbackDialog } from "./staffing-fallback-dialog"
import { SwitchRoomDialog } from "./switch-room-dialog"
import {
  SchedulingPlanCalendarGroupTeachersCarousel,
  type GroupTeacherAccessibilityItem,
} from "../scheduling-plan-calendar-group-teachers-carousel"
import {
  AssignSlotDialog,
  type CurrentAssignmentState,
  type TargetSlotInfo,
} from "./assign-slot-dialog"
import {
  evaluateFreeTeacherSwap,
  evaluateProposalSwap,
  resolveTargetTeacherForSlot,
  type FreeTeacherSwapTarget,
  type OccupiedClassroomSlot,
  type SwapEvaluationResult,
  type SwapTarget,
} from "./helper/swap-eligibility.helper"
import { buildProposalColorMap } from "./helper/course-color-group.helper"
import { SwapClassDialog } from "./swap-class-dialog"
import { classroomsResource, schedulingResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

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
  unresolvedRequirements?: SchedulingPlanDetailsDto["unresolvedRequirements"]
  planId?: string
  planStatus?: string
  defaultCollapsed?: boolean
  initialExpandedSlots?: string[]
  stickyTop?: "page" | "dialog"
  selectedTeacherId?: string | null
  onTeacherChange?: (teacherId: string | null) => void
}

export function SchedulingPlanCalendarView({
  proposals: incomingProposals,
  canEdit,
  canSwap = canEdit,
  hiringPlan,
  missedClassesAssignments: incomingMissedClassesAssignments,
  onAssignMissedClass,
  onUnassignMissedClass,
  onUpdateMissedClassesAssignments,
  teacherCalendars,
  unresolvedRequirements,
  planId,
  planStatus,
  defaultCollapsed = false,
  initialExpandedSlots,
  stickyTop = "page",
  selectedTeacherId,
  onTeacherChange,
}: SchedulingPlanCalendarViewProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const [internalTeacherId, setInternalTeacherId] = React.useState<
    string | null
  >(null)
  const activeTeacherFilterId =
    selectedTeacherId !== undefined ? selectedTeacherId : internalTeacherId
  const handleTeacherChange = onTeacherChange ?? setInternalTeacherId

  const selectedTeacherCalendar = React.useMemo(() => {
    if (!activeTeacherFilterId || !teacherCalendars) return null
    return (
      teacherCalendars.find((c) => c.teacher.id === activeTeacherFilterId) ??
      null
    )
  }, [activeTeacherFilterId, teacherCalendars])

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
  const [swappingProposalId, setSwappingProposalId] = React.useState<
    string | null
  >(null)
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const [teacherToRemove, setTeacherToRemove] = React.useState<Proposal | null>(
    null
  )
  const removeTeacherMutation = useMutation({
    ...schedulingResource.updateProposal.toMutation(),
  })
  const updateDeliveryModeMutation = useMutation({
    ...schedulingResource.updateProposal.toMutation(),
  })
  const updateProposalMutation = useMutation({
    ...schedulingResource.updateProposal.toMutation(),
  })
  const [movingProposalId, setMovingProposalId] = React.useState<string | null>(
    null
  )
  const { data: instituteClassrooms = [] } = useQuery({
    ...classroomsResource.list.toQuery({
      instituteId: activeInstituteId,
      isActive: true,
    }),
    enabled: Boolean(activeInstituteId),
  })
  const [swapDialogState, setSwapDialogState] = React.useState<{
    sourceProposal: Proposal
    target: SwapTarget
    evaluation: SwapEvaluationResult
  } | null>(null)
  const [staffingDialogSession, setStaffingDialogSession] = React.useState<{
    courseTitle: string
    unresolvedRequirementId?: string
    fallback: StaffingFallbackDto
    hiringAssignments: SchedulingNewTeacherHiringAssignment[]
    requirement?:
      SchedulingPlanDetailsDto["unresolvedRequirements"][number] | null
  } | null>(null)
  const [highlightRelated, setHighlightRelated] = React.useState(true)
  const [switchRoomProposal, setSwitchRoomProposal] =
    React.useState<Proposal | null>(null)
  const [mobileTrack, setMobileTrack] = React.useState<DayTrack>("EVEN")
  const mobileTrackRef = React.useRef<DayTrack>(mobileTrack)
  const carouselApisRef = React.useRef<Map<string, CarouselApi>>(new Map())

  React.useEffect(() => {
    mobileTrackRef.current = mobileTrack
    const targetIndex = mobileTrack === "EVEN" ? 0 : 1
    carouselApisRef.current.forEach((api) => {
      if (api && api.selectedScrollSnap() !== targetIndex) {
        api.scrollTo(targetIndex)
      }
    })
  }, [mobileTrack])

  const handleSetCarouselApi = React.useCallback(
    (slotKey: string, api: CarouselApi | undefined) => {
      if (!api) {
        carouselApisRef.current.delete(slotKey)
        return
      }
      carouselApisRef.current.set(slotKey, api)

      const targetIndex = mobileTrackRef.current === "EVEN" ? 0 : 1
      if (api.selectedScrollSnap() !== targetIndex) {
        api.scrollTo(targetIndex, true)
      }

      const onSelect = () => {
        const selectedIndex = api.selectedScrollSnap()
        const newTrack = DAY_TRACKS[selectedIndex]
        if (newTrack && newTrack !== mobileTrackRef.current) {
          mobileTrackRef.current = newTrack
          setMobileTrack(newTrack)
          carouselApisRef.current.forEach((otherApi, otherKey) => {
            if (
              otherKey !== slotKey &&
              otherApi &&
              otherApi.selectedScrollSnap() !== selectedIndex
            ) {
              otherApi.scrollTo(selectedIndex)
            }
          })
        }
      }

      api.on("select", onSelect)
    },
    []
  )

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

  const allSwappableProposals = React.useMemo(
    () => proposals.filter((p) => Boolean(p.teacherId || p.teacher)),
    [proposals]
  )

  const activeProposal = React.useMemo(
    () =>
      activeClassId
        ? (allSwappableProposals.find((p) => p.id === activeClassId) ?? null)
        : null,
    [activeClassId, allSwappableProposals]
  )

  const swappingProposal = React.useMemo(
    () =>
      swappingProposalId
        ? (proposals.find((p) => p.id === swappingProposalId) ?? null)
        : null,
    [swappingProposalId, proposals]
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
    let count = proposals.filter((p) => {
      if (activeCourseId && p.course?.id === activeCourseId) return true
      if (activeCourseTitle && p.course?.title === activeCourseTitle)
        return true
      return false
    }).length
    for (const assignment of hiringPlan?.assignments ?? []) {
      const state = missedClassesAssignments?.[assignment.key]
      if (state && state.isAssigned !== false && state.daysOfWeek.length > 0) {
        if (
          (activeCourseId && assignment.course?.id === activeCourseId) ||
          (activeCourseTitle && assignment.course?.title === activeCourseTitle)
        ) {
          count++
        }
      }
    }
    return count
  }, [
    activeProposal,
    activeCourseId,
    activeCourseTitle,
    proposals,
    hiringPlan,
    missedClassesAssignments,
  ])

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
    if (!canSwap || !swappingProposal) return map
    for (const proposal of allSwappableProposals) {
      if (proposal.id === swappingProposal.id) continue
      const evaluation = evaluateProposalSwap(
        swappingProposal,
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
    swappingProposal,
    allSwappableProposals,
    teacherCalendars,
    occupiedClassroomSlots,
  ])

  const handleMissedCardClick = React.useCallback(
    (assignment: SchedulingNewTeacherHiringAssignment) => {
      const matchedReq = unresolvedRequirements?.find(
        (req) =>
          req.id === assignment.requirementId ||
          req.classRequirement?.id === assignment.requirementId ||
          req.classRequirement?.course.id === assignment.course.id
      )
      const fallback: StaffingFallbackDto = matchedReq?.recovery
        ?.staffingFallback ?? {
        addTeacherSuggested: true,
        availabilityOptions: [],
      }
      const targetCourseTitle =
        matchedReq?.classRequirement?.course.title ?? assignment.course.title

      const matchingAssignments =
        hiringPlan?.assignments
          .filter(
            (a) =>
              a.requirementId === assignment.requirementId ||
              a.course.id === assignment.course.id
          )
          .map((a) => {
            const ov = missedClassesAssignments?.[a.key]
            if (!ov || ov.isAssigned === false || !ov.daysOfWeek.length) {
              return a
            }
            return {
              ...a,
              daysOfWeek: ov.daysOfWeek,
              startTime: ov.startTime,
              endTime: ov.endTime,
              classroom:
                a.deliveryMode === "ONLINE"
                  ? null
                  : ov.classroomId && ov.classroomName
                    ? {
                        id: ov.classroomId,
                        name: ov.classroomName,
                        capacity: a.classroom?.capacity ?? 1,
                      }
                    : a.classroom,
            }
          }) ?? []

      setStaffingDialogSession({
        courseTitle: targetCourseTitle,
        unresolvedRequirementId: matchedReq?.id ?? assignment.requirementId,
        fallback,
        requirement: matchedReq ?? null,
        hiringAssignments:
          matchingAssignments.length > 0 ? matchingAssignments : [assignment],
      })
    },
    [unresolvedRequirements, hiringPlan, missedClassesAssignments]
  )

  const handleCardClick = React.useCallback(
    (id: string) => {
      const targetProposal = proposals.find((p) => p.id === id)
      if (
        targetProposal &&
        !targetProposal.teacherId &&
        !targetProposal.teacher
      ) {
        const matchedReq = unresolvedRequirements?.find(
          (req) =>
            req.classRequirement?.course.id === targetProposal.course?.id ||
            req.classRequirement?.id === targetProposal.courseId ||
            req.id === targetProposal.courseId
        )
        const fallback: StaffingFallbackDto = matchedReq?.recovery
          ?.staffingFallback ?? {
          addTeacherSuggested: true,
          availabilityOptions: [],
        }
        const targetCourseTitle =
          matchedReq?.classRequirement?.course.title ??
          targetProposal.course?.title ??
          targetProposal.title

        setStaffingDialogSession({
          courseTitle: targetCourseTitle,
          unresolvedRequirementId: matchedReq?.id,
          fallback,
          requirement: matchedReq ?? null,
          hiringAssignments: [
            {
              key: `prop-${targetProposal.id}`,
              requirementId: matchedReq?.id ?? targetProposal.id,
              course: {
                id: targetProposal.course?.id ?? "",
                title: targetCourseTitle,
              },
              classNumber: 1,
              deliveryMode: targetProposal.deliveryMode,
              daysOfWeek: targetProposal.daysOfWeek,
              startTime: targetProposal.startTime,
              endTime: targetProposal.endTime,
              classroom: targetProposal.classroom,
            },
          ],
        })
        return
      }

      // If already in swapping mode (initiated via swap button)
      if (swappingProposal && id !== swappingProposal.id) {
        const swapEvaluation = swappableByProposalId.get(id)
        const swappableTarget = allSwappableProposals.find((p) => p.id === id)
        if (swapEvaluation && swappableTarget) {
          setSwapDialogState({
            sourceProposal: swappingProposal,
            target: { kind: "PROPOSAL", proposal: swappableTarget },
            evaluation: swapEvaluation,
          })
          return
        }
        // If clicking on an unswappable card, exit swap mode and select the clicked card
        setSwappingProposalId(null)
      }

      if (swappingProposalId === id) {
        setSwappingProposalId(null)
      }

      setSelectedClassId((prev) => (prev === id ? null : id))
    },
    [
      swappingProposal,
      swappingProposalId,
      allSwappableProposals,
      proposals,
      swappableByProposalId,
      unresolvedRequirements,
    ]
  )

  const handleSwapButtonClick = React.useCallback(
    (id: string) => {
      const targetProposal = proposals.find((p) => p.id === id)
      if (!targetProposal) return

      if (swappingProposalId === id) {
        setSwappingProposalId(null)
        setSelectedClassId(null)
        return
      }

      if (swappingProposal && id !== swappingProposal.id) {
        const swapEvaluation = swappableByProposalId.get(id)
        const swappableTarget = allSwappableProposals.find((p) => p.id === id)
        if (swapEvaluation && swappableTarget) {
          setSwapDialogState({
            sourceProposal: swappingProposal,
            target: { kind: "PROPOSAL", proposal: swappableTarget },
            evaluation: swapEvaluation,
          })
          return
        }
      }

      setSwappingProposalId(id)
      setSelectedClassId(id)
    },
    [
      proposals,
      swappingProposalId,
      swappingProposal,
      swappableByProposalId,
      allSwappableProposals,
    ]
  )

  const handleConfirmRemoveTeacher = React.useCallback(async () => {
    if (!teacherToRemove) return
    const targetInstituteId = activeInstituteId || teacherToRemove.instituteId
    const targetPlanId = planId || teacherToRemove.planId
    if (!targetInstituteId || !targetPlanId) return
    try {
      const updated = await removeTeacherMutation.mutateAsync({
        planId: targetPlanId,
        proposalId: teacherToRemove.id,
        instituteId: targetInstituteId,
        body: {
          teacherId: null,
        },
      })
      setProposalOverrides((prev) => {
        const nextById = { ...prev.byId }
        nextById[teacherToRemove.id] = {
          ...teacherToRemove,
          teacherId: null,
          teacher: null,
          teacherQualificationId: null,
          isManuallyEdited: true,
          warnings: updated.warnings ?? teacherToRemove.warnings,
        }
        return { byId: nextById }
      })
      if (selectedClassId === teacherToRemove.id) {
        setSelectedClassId(null)
      }
      if (swappingProposalId === teacherToRemove.id) {
        setSwappingProposalId(null)
      }
      await queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.key({
          planId: targetPlanId,
          instituteId: targetInstituteId,
        }),
      })
      toast.success(t("calendarView.teacherRemovedSuccess"))
      setTeacherToRemove(null)
    } catch {
      // Global toast handles error
    }
  }, [
    teacherToRemove,
    activeInstituteId,
    planId,
    removeTeacherMutation,
    selectedClassId,
    swappingProposalId,
    queryClient,
    t,
  ])

  const handleDeliveryModeChange = React.useCallback(
    async (proposal: Proposal): Promise<boolean> => {
      const targetInstituteId = activeInstituteId || proposal.instituteId
      const targetPlanId = planId || proposal.planId
      if (!targetInstituteId || !targetPlanId) return true

      if (proposal.deliveryMode === "IN_PERSON") {
        try {
          const updated = await updateDeliveryModeMutation.mutateAsync({
            planId: targetPlanId,
            proposalId: proposal.id,
            instituteId: targetInstituteId,
            body: {
              deliveryMode: "ONLINE",
              classroomId: null,
            },
          })
          setProposalOverrides((prev) => {
            const nextById = { ...prev.byId }
            nextById[proposal.id] = {
              ...proposal,
              deliveryMode: "ONLINE",
              classroomId: null,
              classroom: null,
              isManuallyEdited: true,
              warnings: updated.warnings ?? proposal.warnings,
            }
            return { byId: nextById }
          })
          await queryClient.invalidateQueries({
            queryKey: schedulingResource.planDetail.key({
              planId: targetPlanId,
              instituteId: targetInstituteId,
            }),
          })
          toast.success(t("calendarView.switchedToOnlineSuccess"))
          return true
        } catch {
          return true
        }
      } else {
        const candidateRoom = instituteClassrooms.find((room) => {
          const matchesBranch =
            !proposal.branchId ||
            !room.branchId ||
            room.branchId === proposal.branchId
          const hasCapacity = room.capacity >= proposal.capacity
          if (!matchesBranch || !hasCapacity) return false

          const hasConflict = proposals.some(
            (p) =>
              p.id !== proposal.id &&
              p.deliveryMode === "IN_PERSON" &&
              (p.classroomId === room.id || p.classroom?.id === room.id) &&
              p.daysOfWeek.some((d) => proposal.daysOfWeek.includes(d)) &&
              p.startTime < proposal.endTime &&
              proposal.startTime < p.endTime
          )
          return !hasConflict
        })

        if (!candidateRoom) {
          toast.info(t("calendarView.selectClassroomInEditHint"))
          return false
        }

        try {
          const updated = await updateDeliveryModeMutation.mutateAsync({
            planId: targetPlanId,
            proposalId: proposal.id,
            instituteId: targetInstituteId,
            body: {
              deliveryMode: "IN_PERSON",
              classroomId: candidateRoom.id,
              branchId: candidateRoom.branchId ?? proposal.branchId ?? null,
            },
          })
          setProposalOverrides((prev) => {
            const nextById = { ...prev.byId }
            nextById[proposal.id] = {
              ...proposal,
              deliveryMode: "IN_PERSON",
              classroomId: candidateRoom.id,
              classroom: {
                id: candidateRoom.id,
                name: candidateRoom.name,
                capacity: candidateRoom.capacity,
              },
              branchId: candidateRoom.branchId ?? proposal.branchId ?? null,
              isManuallyEdited: true,
              warnings: updated.warnings ?? proposal.warnings,
            }
            return { byId: nextById }
          })
          await queryClient.invalidateQueries({
            queryKey: schedulingResource.planDetail.key({
              planId: targetPlanId,
              instituteId: targetInstituteId,
            }),
          })
          toast.success(t("calendarView.switchedToInPersonSuccess"))
          return true
        } catch {
          return true
        }
      }
    },
    [
      activeInstituteId,
      planId,
      updateDeliveryModeMutation,
      instituteClassrooms,
      proposals,
      queryClient,
      t,
    ]
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
      setSwappingProposalId(null)
    },
    [onUpdateMissedClassesAssignments]
  )

  // Clear selected class and swap mode on Escape key when no modal dialog is open
  React.useEffect(() => {
    if (
      (!selectedClassId && !swappingProposalId) ||
      swapDialogState ||
      assignSlotTarget
    )
      return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedClassId(null)
        setSwappingProposalId(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedClassId, swappingProposalId, swapDialogState, assignSlotTarget])

  const timeSlots = React.useMemo<TimeSlot[]>(() => {
    const slotsMap = new Map<string, TimeSlot>()
    for (const proposal of incomingProposals) {
      const key = `${proposal.startTime}-${proposal.endTime}`
      if (!slotsMap.has(key)) {
        slotsMap.set(key, {
          startTime: proposal.startTime,
          endTime: proposal.endTime,
          key,
        })
      }
    }
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
    return Array.from(slotsMap.values()).sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime) ||
        a.endTime.localeCompare(b.endTime)
    )
  }, [proposals, hiringPlan, missedClassesAssignments])

  const allCandidateRooms = React.useMemo(() => {
    const roomsMap = new Map<
      string,
      { id: string; name: string; capacity: number; branchId?: string | null }
    >()
    for (const c of instituteClassrooms) {
      roomsMap.set(c.id, {
        id: c.id,
        name: c.name,
        capacity: c.capacity,
        branchId: c.branchId ?? null,
      })
    }
    for (const [id, c] of knownClassroomsById) {
      if (!roomsMap.has(id)) {
        roomsMap.set(id, {
          id: c.id,
          name: c.name,
          capacity: c.capacity,
          branchId: null,
        })
      }
    }
    return Array.from(roomsMap.values())
  }, [instituteClassrooms, knownClassroomsById])

  interface MoveTargetCellInfo {
    targetDays: WeekDay[]
    startTime: string
    endTime: string
    targetRoom: TargetRoomInfo | null
    targetTeacher: SchedulingTeacherCalendar["teacher"] | null
    teacherStatus: "SAME_TEACHER" | "REASSIGNED_TEACHER" | "UNASSIGNED"
  }

  const moveTargetsByCellKey = React.useMemo(() => {
    const map = new Map<string, MoveTargetCellInfo>()
    if (
      !canSwap ||
      !swappingProposal ||
      swappingProposal.isLocked ||
      Boolean(swappingProposal.publishedClassId)
    ) {
      return map
    }

    const sourceTracks = getDaysOfWeekTracks(swappingProposal.daysOfWeek)
    const currentRoomId =
      swappingProposal.classroomId ?? swappingProposal.classroom?.id ?? null

    for (const slot of timeSlots) {
      for (const track of DAY_TRACKS) {
        const cellKey = `${track}-${slot.startTime}-${slot.endTime}`

        // Exclusion rule: do not show dashed card in the period where the selected card currently is
        const isSourcePeriod =
          sourceTracks.includes(track) &&
          slot.startTime === swappingProposal.startTime &&
          slot.endTime === swappingProposal.endTime
        if (isSourcePeriod) {
          continue
        }

        const targetDays: WeekDay[] =
          track === "EVEN" ? [...EVEN_DAYS] : [...ODD_DAYS]

        // Resolve teacher assignment for the target slot (keep current, reassign to free qualified master, or leave empty)
        const { targetTeacher, teacherStatus } = resolveTargetTeacherForSlot(
          swappingProposal,
          targetDays,
          slot.startTime,
          slot.endTime,
          proposals,
          teacherCalendars
        )

        // Check room availability & capacity
        if (swappingProposal.deliveryMode === "IN_PERSON") {
          const eligibleRooms = allCandidateRooms.filter((room) => {
            // Check branch match
            if (
              swappingProposal.branchId &&
              room.branchId &&
              room.branchId !== swappingProposal.branchId
            ) {
              return false
            }

            // Crucial condition: capacity check (room capacity must be at least proposal capacity)
            if (room.capacity < swappingProposal.capacity) {
              return false
            }

            // Check if room is occupied by another proposal
            const isOccupiedByProposal = proposals.some(
              (p) =>
                p.id !== swappingProposal.id &&
                p.deliveryMode === "IN_PERSON" &&
                (p.classroomId === room.id || p.classroom?.id === room.id) &&
                p.daysOfWeek.some((d) => targetDays.includes(d)) &&
                p.startTime < slot.endTime &&
                slot.startTime < p.endTime
            )
            if (isOccupiedByProposal) {
              return false
            }

            // Check if room is occupied by missed class
            const isOccupiedByMissed = occupiedClassroomSlots.some(
              (s) =>
                s.classroomId === room.id &&
                s.daysOfWeek.some((d) => targetDays.includes(d)) &&
                s.startTime < slot.endTime &&
                slot.startTime < s.endTime
            )
            if (isOccupiedByMissed) {
              return false
            }

            return true
          })

          if (eligibleRooms.length === 0) {
            continue
          }

          // Prefer keeping current room if available and eligible; otherwise pick room with smallest sufficient capacity
          const sameRoom = currentRoomId
            ? eligibleRooms.find((r) => r.id === currentRoomId)
            : null
          const chosenRoom =
            sameRoom ??
            [...eligibleRooms].sort((a, b) => a.capacity - b.capacity)[0]!

          map.set(cellKey, {
            targetDays,
            startTime: slot.startTime,
            endTime: slot.endTime,
            targetRoom: chosenRoom,
            targetTeacher,
            teacherStatus,
          })
        } else {
          // ONLINE delivery mode
          map.set(cellKey, {
            targetDays,
            startTime: slot.startTime,
            endTime: slot.endTime,
            targetRoom: null,
            targetTeacher,
            teacherStatus,
          })
        }
      }
    }

    return map
  }, [
    canSwap,
    swappingProposal,
    timeSlots,
    proposals,
    teacherCalendars,
    allCandidateRooms,
    occupiedClassroomSlots,
  ])

  const handleMoveSession = React.useCallback(
    async (target: MoveTargetCellInfo) => {
      if (!swappingProposal) return
      const targetInstituteId =
        activeInstituteId || swappingProposal.instituteId
      const targetPlanId = planId || swappingProposal.planId
      if (!targetInstituteId || !targetPlanId) return

      setMovingProposalId(swappingProposal.id)
      try {
        const body: UpdateSchedulingProposalInput = {
          daysOfWeek: target.targetDays,
          startTime: target.startTime,
          endTime: target.endTime,
        }
        if (
          swappingProposal.deliveryMode === "IN_PERSON" &&
          target.targetRoom
        ) {
          body.classroomId = target.targetRoom.id
          if (target.targetRoom.branchId) {
            body.branchId = target.targetRoom.branchId
          }
        }
        if (
          target.teacherStatus === "REASSIGNED_TEACHER" &&
          target.targetTeacher
        ) {
          body.teacherId = target.targetTeacher.id
        } else if (target.teacherStatus === "UNASSIGNED") {
          body.teacherId = null
        }

        const updated = await updateProposalMutation.mutateAsync({
          planId: targetPlanId,
          proposalId: swappingProposal.id,
          instituteId: targetInstituteId,
          body,
        })

        setProposalOverrides((prev) => {
          const nextById = { ...prev.byId }
          nextById[swappingProposal.id] = {
            ...swappingProposal,
            daysOfWeek: target.targetDays,
            startTime: target.startTime,
            endTime: target.endTime,
            teacherId:
              target.teacherStatus === "REASSIGNED_TEACHER" &&
              target.targetTeacher
                ? target.targetTeacher.id
                : target.teacherStatus === "UNASSIGNED"
                  ? null
                  : swappingProposal.teacherId,
            teacher:
              target.teacherStatus === "REASSIGNED_TEACHER" &&
              target.targetTeacher
                ? {
                    id: target.targetTeacher.id,
                    firstName: target.targetTeacher.firstName,
                    lastName: target.targetTeacher.lastName,
                    avatarUrl: target.targetTeacher.avatarUrl ?? null,
                  }
                : target.teacherStatus === "UNASSIGNED"
                  ? null
                  : swappingProposal.teacher,
            teacherQualificationId:
              target.teacherStatus === "UNASSIGNED"
                ? null
                : swappingProposal.teacherQualificationId,
            classroomId: target.targetRoom
              ? target.targetRoom.id
              : swappingProposal.classroomId,
            classroom: target.targetRoom
              ? {
                  id: target.targetRoom.id,
                  name: target.targetRoom.name,
                  capacity: target.targetRoom.capacity,
                }
              : swappingProposal.classroom,
            branchId: target.targetRoom?.branchId ?? swappingProposal.branchId,
            isManuallyEdited: true,
            warnings: updated.warnings ?? swappingProposal.warnings,
          }
          return { byId: nextById }
        })

        setSwappingProposalId(null)
        setSelectedClassId(null)

        await queryClient.invalidateQueries({
          queryKey: schedulingResource.planDetail.baseKey(),
        })

        if (
          target.teacherStatus === "REASSIGNED_TEACHER" &&
          target.targetTeacher
        ) {
          toast.success(
            t("calendarView.sessionMovedWithTeacherChangeSuccess", {
              time: `${target.startTime} - ${target.endTime}`,
              teacher: `${target.targetTeacher.firstName} ${target.targetTeacher.lastName}`,
            })
          )
        } else if (target.teacherStatus === "UNASSIGNED") {
          toast.success(
            t("calendarView.sessionMovedWithUnassignedTeacherSuccess", {
              time: `${target.startTime} - ${target.endTime}`,
            })
          )
        } else if (target.targetRoom) {
          toast.success(
            t("calendarView.sessionMovedWithRoomSuccess", {
              time: `${target.startTime} - ${target.endTime}`,
              room: target.targetRoom.name,
            })
          )
        } else {
          toast.success(t("calendarView.sessionMovedSuccess"))
        }
      } catch {
        // Global toast handles error
      } finally {
        setMovingProposalId(null)
      }
    },
    [
      swappingProposal,
      activeInstituteId,
      planId,
      updateProposalMutation,
      queryClient,
      t,
    ]
  )

  const handleSwitchRoom = React.useCallback(
    async (
      targetProposal: Proposal,
      newRoomId: string,
      swapProposal?: Proposal
    ) => {
      const targetPlanId = planId ?? targetProposal.planId
      const targetInstituteId = activeInstituteId ?? targetProposal.instituteId
      const targetRoom = instituteClassrooms.find((r) => r.id === newRoomId)
      if (!targetPlanId || !targetRoom) return

      try {
        if (swapProposal) {
          const currentRoomId =
            targetProposal.classroomId ?? targetProposal.classroom?.id ?? null
          const currentRoom = instituteClassrooms.find(
            (r) => r.id === currentRoomId
          )

          await Promise.all([
            updateProposalMutation.mutateAsync({
              planId: targetPlanId,
              proposalId: targetProposal.id,
              instituteId: targetInstituteId,
              body: {
                classroomId: targetRoom.id,
                ...(targetRoom.branchId
                  ? { branchId: targetRoom.branchId }
                  : {}),
              },
            }),
            updateProposalMutation.mutateAsync({
              planId: targetPlanId,
              proposalId: swapProposal.id,
              instituteId: targetInstituteId,
              body: {
                classroomId: currentRoom?.id ?? null,
                ...(currentRoom?.branchId
                  ? { branchId: currentRoom.branchId }
                  : {}),
              },
            }),
          ])

          setProposalOverrides((prev) => {
            const nextById = { ...prev.byId }
            nextById[targetProposal.id] = {
              ...targetProposal,
              classroomId: targetRoom.id,
              classroom: {
                id: targetRoom.id,
                name: targetRoom.name,
                capacity: targetRoom.capacity,
              },
              branchId: targetRoom.branchId ?? targetProposal.branchId,
              isManuallyEdited: true,
            }
            if (currentRoom) {
              nextById[swapProposal.id] = {
                ...swapProposal,
                classroomId: currentRoom.id,
                classroom: {
                  id: currentRoom.id,
                  name: currentRoom.name,
                  capacity: currentRoom.capacity,
                },
                branchId: currentRoom.branchId ?? swapProposal.branchId,
                isManuallyEdited: true,
              }
            }
            return { byId: nextById }
          })

          toast.success(t("calendarView.swapRoomSuccess"))
        } else {
          await updateProposalMutation.mutateAsync({
            planId: targetPlanId,
            proposalId: targetProposal.id,
            instituteId: targetInstituteId,
            body: {
              classroomId: targetRoom.id,
              ...(targetRoom.branchId ? { branchId: targetRoom.branchId } : {}),
            },
          })

          setProposalOverrides((prev) => {
            const nextById = { ...prev.byId }
            nextById[targetProposal.id] = {
              ...targetProposal,
              classroomId: targetRoom.id,
              classroom: {
                id: targetRoom.id,
                name: targetRoom.name,
                capacity: targetRoom.capacity,
              },
              branchId: targetRoom.branchId ?? targetProposal.branchId,
              isManuallyEdited: true,
            }
            return { byId: nextById }
          })

          toast.success(t("calendarView.switchRoomSuccess"))
        }

        await queryClient.invalidateQueries({
          queryKey: schedulingResource.planDetail.key({
            planId: targetPlanId,
            instituteId: targetInstituteId,
          }),
        })
      } catch {
        // Handled by global toast
      }
    },
    [
      planId,
      activeInstituteId,
      instituteClassrooms,
      updateProposalMutation,
      queryClient,
      t,
    ]
  )

  const expandedSlots = React.useMemo(() => {
    if (userExpandedSlots !== null) return userExpandedSlots
    if (!defaultCollapsed) {
      return new Set(timeSlots.map((s) => s.key))
    }
    return new Set<string>()
  }, [userExpandedSlots, defaultCollapsed, timeSlots])

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

  // Automatically expand all time slots when swap mode is entered so all shaking/swappable cards are visible
  React.useEffect(() => {
    if (swappingProposalId && timeSlots.length > 0) {
      setUserExpandedSlots(new Set(timeSlots.map((s) => s.key)))
    }
  }, [swappingProposalId, timeSlots])

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

  const proposalColorMap = React.useMemo(
    () => buildProposalColorMap(proposals),
    [proposals]
  )

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

  const groupTeachersByTrackAndSlot = React.useMemo(() => {
    const map = new Map<string, GroupTeacherAccessibilityItem[]>()
    if (!teacherCalendars?.length && !proposals.length) return map

    for (const slot of timeSlots) {
      for (const track of DAY_TRACKS) {
        const trackDays = track === "EVEN" ? EVEN_DAYS : ODD_DAYS
        const cellKey = `${track}-${slot.startTime}-${slot.endTime}`
        const cellProposals = proposalsByTrackAndSlot.get(cellKey) ?? []
        const cellMissed = missedClassesByTrackAndSlot.get(cellKey) ?? []

        const items: GroupTeacherAccessibilityItem[] = []
        const addedTeacherIds = new Set<string>()

        // 1. Teachers currently teaching proposals in this cell
        for (const proposal of cellProposals) {
          const teacherId = proposal.teacherId ?? proposal.teacher?.id
          if (!teacherId || addedTeacherIds.has(teacherId)) continue

          const calendar = teacherCalendars?.find(
            (c) => c.teacher.id === teacherId
          )
          const teacher = proposal.teacher ?? calendar?.teacher
          if (!teacher) continue

          const teachableCourses = calendar?.teachableCourses ?? []
          const levelRange = summarizeCourseLevelRange(teachableCourses)
          const isSelected = activeTeacherFilterId === teacher.id
          const isDimmed = isAnyClassActive && !isSelected

          items.push({
            teacher,
            status: "TEACHING",
            teachingClassTitle:
              proposal.course?.title ?? proposal.title ?? null,
            levelRange,
            isSelected,
            isDimmed,
            isSwappable: false,
          })
          addedTeacherIds.add(teacherId)
        }

        // 2. Teachers from teacherCalendars
        if (teacherCalendars) {
          for (const calendar of teacherCalendars) {
            if (addedTeacherIds.has(calendar.teacher.id)) continue

            // Check if teacher has teaching proposals in this track & slot
            const teachingProposal = proposals.find(
              (p) =>
                (p.teacherId ?? p.teacher?.id) === calendar.teacher.id &&
                p.daysOfWeek.some((d) => trackDays.includes(d as WeekDay)) &&
                p.startTime < slot.endTime &&
                slot.startTime < p.endTime
            )

            // Check matching slots in calendar
            const matchingSlots = calendar.slots.filter(
              (s) =>
                trackDays.includes(s.dayOfWeek) &&
                s.startTime <= slot.startTime &&
                s.endTime >= slot.endTime
            )

            const hasExistingClass = matchingSlots.some(
              (s) => s.status === "BUSY" && s.source === "EXISTING_CLASS"
            )

            const isFreeSlot =
              !hasExistingClass &&
              matchingSlots.some(
                (s) =>
                  s.status === "FREE" ||
                  (s.status === "BUSY" && s.source === "PLAN")
              )

            if (teachingProposal) {
              const teachableCourses = calendar.teachableCourses ?? []
              const levelRange = summarizeCourseLevelRange(teachableCourses)
              const isSelected = activeTeacherFilterId === calendar.teacher.id
              const isDimmed = isAnyClassActive && !isSelected

              items.push({
                teacher: calendar.teacher,
                status: "TEACHING",
                teachingClassTitle:
                  teachingProposal.course?.title ??
                  teachingProposal.title ??
                  null,
                levelRange,
                isSelected,
                isDimmed,
                isSwappable: false,
              })
              addedTeacherIds.add(calendar.teacher.id)
            } else if (isFreeSlot) {
              const teachableCourses = calendar.teachableCourses ?? []
              const levelRange = summarizeCourseLevelRange(teachableCourses)
              const representativeDay: WeekDay =
                track === "EVEN" ? "SATURDAY" : "SUNDAY"

              const suggestedCourseTitle =
                cellMissed.find(
                  ({ assignment }) =>
                    teachableCourses.some(
                      (tc) => tc.id === assignment.course.id
                    ) ||
                    Boolean(
                      findHigherLevelCourse(assignment.course, teachableCourses)
                    )
                )?.assignment.course.title ?? null

              const freeTarget: FreeTeacherSwapTarget = {
                kind: "FREE_TEACHER",
                teacher: calendar.teacher,
                teachableCourses,
                levelRange,
                dayOfWeek: representativeDay,
                startTime: slot.startTime,
                endTime: slot.endTime,
              }

              const freeEvaluation =
                canSwap && swappingProposal
                  ? evaluateFreeTeacherSwap(
                      swappingProposal,
                      freeTarget,
                      proposals,
                      teacherCalendars,
                      occupiedClassroomSlots
                    )
                  : null

              const isFreeSwappable = Boolean(freeEvaluation?.canSwap)
              const isDimmed = isAnyClassActive && !isFreeSwappable
              const isSelected = activeTeacherFilterId === calendar.teacher.id

              items.push({
                teacher: calendar.teacher,
                status: "AVAILABLE",
                levelRange,
                suggestedCourseTitle,
                swapTarget: freeTarget,
                swapEvaluation: freeEvaluation,
                isSwappable: isFreeSwappable,
                isDimmed,
                isSelected,
              })
              addedTeacherIds.add(calendar.teacher.id)
            } else if (hasExistingClass) {
              const busySlot = matchingSlots.find(
                (s) => s.status === "BUSY" && s.source === "EXISTING_CLASS"
              )
              const teachableCourses = calendar.teachableCourses ?? []
              const levelRange = summarizeCourseLevelRange(teachableCourses)
              const isSelected = activeTeacherFilterId === calendar.teacher.id
              const isDimmed = isAnyClassActive && !isSelected

              items.push({
                teacher: calendar.teacher,
                status: "TEACHING",
                teachingClassTitle: busySlot?.title ?? null,
                levelRange,
                isSelected,
                isDimmed,
                isSwappable: false,
              })
              addedTeacherIds.add(calendar.teacher.id)
            }
          }
        }

        // Sort: AVAILABLE first, then TEACHING, then by name
        items.sort((a, b) => {
          if (a.status === "AVAILABLE" && b.status !== "AVAILABLE") return -1
          if (a.status !== "AVAILABLE" && b.status === "AVAILABLE") return 1
          return `${a.teacher.firstName} ${a.teacher.lastName}`.localeCompare(
            `${b.teacher.firstName} ${b.teacher.lastName}`,
            locale
          )
        })

        if (items.length > 0) {
          map.set(cellKey, items)
        }
      }
    }

    return map
  }, [
    teacherCalendars,
    proposals,
    timeSlots,
    proposalsByTrackAndSlot,
    missedClassesByTrackAndSlot,
    activeTeacherFilterId,
    isAnyClassActive,
    canSwap,
    swappingProposal,
    occupiedClassroomSlots,
    locale,
  ])

  const areAllExpanded =
    timeSlots.length > 0 && timeSlots.every((s) => expandedSlots.has(s.key))

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
          if (selectedClassId || swappingProposalId) {
            setSelectedClassId(null)
            setSwappingProposalId(null)
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
            {activeTeacherFilterId && selectedTeacherCalendar && (
              <div
                data-testid="selected-teacher-filter-chip"
                className="inline-flex items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success-foreground"
              >
                <span className="inline-block size-2 rounded-full bg-success" />
                <span>
                  {t("calendarView.selectedTeacherFilter", {
                    name: `${selectedTeacherCalendar.teacher.firstName} ${selectedTeacherCalendar.teacher.lastName}`.trim(),
                  })}
                </span>
                <button
                  type="button"
                  data-testid="clear-teacher-filter-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTeacherChange(null)
                  }}
                  className="ms-1 cursor-pointer rounded-xs text-muted-foreground hover:text-foreground"
                  aria-label={t("calendarView.clearTeacherFilter")}
                >
                  <X aria-hidden className="size-3" />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(selectedClassId || swappingProposalId) && (
              <Button
                type="button"
                variant="link"
                size="xs"
                data-testid="clear-selection-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedClassId(null)
                  setSwappingProposalId(null)
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

        {/* Hour-Grouped Time Slots (Modular Sections with Time at Top) */}
        <div className="flex flex-col gap-4">
          {timeSlots.map((slot) => {
            const isCollapsed = !expandedSlots.has(slot.key)

            const slotEvenKey = `EVEN-${slot.startTime}-${slot.endTime}`
            const slotOddKey = `ODD-${slot.startTime}-${slot.endTime}`
            const evenProposals = proposalsByTrackAndSlot.get(slotEvenKey) ?? []
            const oddProposals = proposalsByTrackAndSlot.get(slotOddKey) ?? []
            const evenMissed =
              missedClassesByTrackAndSlot.get(slotEvenKey) ?? []
            const oddMissed = missedClassesByTrackAndSlot.get(slotOddKey) ?? []
            const totalSlotClasses =
              evenProposals.length +
              oddProposals.length +
              evenMissed.length +
              oddMissed.length

            return (
              <div
                key={slot.key}
                data-testid={`time-slot-row-${slot.key}`}
                className="flex flex-col transition-all duration-300"
              >
                {/* Time at Top of Group List */}
                <button
                  type="button"
                  onClick={() => toggleSlotCollapse(slot.key)}
                  data-testid={`time-slot-toggle-${slot.key}`}
                  className={cn(
                    "group flex min-h-[52px] w-full cursor-pointer items-center justify-between overflow-hidden transition-all duration-300 ease-in-out select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    isCollapsed
                      ? "rounded-2xl border border-border/60 bg-muted/40 px-3.5 py-2 hover:border-primary/40 hover:bg-muted/70"
                      : cn(
                          "sticky z-20 rounded-none bg-background px-3.5 py-2.5 hover:bg-muted/20 sm:py-3 lg:py-3.5",
                          stickyTop === "page" ? "top-16" : "top-0"
                        )
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
                  <div
                    className={cn(
                      "flex items-center transition-all duration-300",
                      isCollapsed ? "gap-2.5" : "gap-2.5 sm:gap-3 lg:gap-3.5"
                    )}
                  >
                    {isCollapsed && (
                      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300">
                        <Clock3
                          aria-hidden
                          className="size-4 text-primary transition-all duration-300"
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex items-center font-bold text-foreground transition-all duration-300",
                        isCollapsed ? "gap-1.5" : "gap-1.5 sm:gap-2 lg:gap-2.5"
                      )}
                    >
                      <span
                        className={cn(
                          "font-semibold text-muted-foreground transition-all duration-300",
                          isCollapsed
                            ? "text-xs"
                            : "text-xs font-semibold sm:text-sm"
                        )}
                      >
                        {t("calendarView.timeColumn")}
                      </span>
                      <span
                        className={cn(
                          "tracking-tight tabular-nums transition-all duration-300",
                          isCollapsed
                            ? "text-base font-bold"
                            : "text-xl font-bold sm:text-2xl lg:text-3xl"
                        )}
                      >
                        {slot.startTime}
                      </span>
                      <span
                        className={cn(
                          "font-semibold text-muted-foreground transition-all duration-300",
                          isCollapsed
                            ? "text-xs"
                            : "text-xs font-semibold sm:text-sm"
                        )}
                      >
                        {t("calendarView.timeTo")}
                      </span>
                      <span
                        className={cn(
                          "tracking-tight tabular-nums transition-all duration-300",
                          isCollapsed
                            ? "text-base font-bold"
                            : "text-xl font-bold sm:text-2xl lg:text-3xl"
                        )}
                      >
                        {slot.endTime}
                      </span>
                    </div>

                    {isCollapsed && (
                      <>
                        <span className="mx-1 text-muted-foreground/40">·</span>

                        {totalSlotClasses > 0 ? (
                          <Badge
                            variant="secondary"
                            data-testid={`slot-classes-badge-${slot.key}`}
                            className="h-5 px-2 text-xs font-bold"
                          >
                            {t("calendarView.classesCount", {
                              count: formatNumber(totalSlotClasses, locale),
                            })}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/70">
                            {t("calendarView.noClasses")}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center text-muted-foreground transition-colors group-hover:text-foreground">
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-4 transition-transform duration-300 ease-in-out",
                        !isCollapsed && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {/* Two Separate Vertical Views for Showing Them (Accordion Content) */}
                <div
                  data-testid={`time-slot-content-${slot.key}`}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
                    isCollapsed
                      ? "pointer-events-none grid-rows-[0fr] overflow-hidden opacity-0"
                      : "grid-rows-[1fr] opacity-100"
                  )}
                >
                  <div className="overflow-hidden">
                    <Carousel
                      setApi={(api) => handleSetCarouselApi(slot.key, api)}
                      opts={{
                        align: "start",
                        containScroll: false,
                        direction: locale === "fa" ? "rtl" : "ltr",
                        breakpoints: {
                          "(min-width: 768px)": { active: false },
                        },
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ms-2.5 md:-ms-0 md:grid md:grid-cols-2 md:items-stretch md:gap-3.5">
                        {DAY_TRACKS.map((track) => {
                          const cellKey = `${track}-${slot.startTime}-${slot.endTime}`
                          const cellProposals =
                            proposalsByTrackAndSlot.get(cellKey) ?? []
                          const cellMissed =
                            missedClassesByTrackAndSlot.get(cellKey) ?? []
                          const moveTarget = moveTargetsByCellKey.get(cellKey)
                          const matchingOption =
                            slotOptionsByTrackAndSlot.get(cellKey)
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
                              const state =
                                missedClassesAssignments?.[assignment.key]
                              const isPlacedOnTrack =
                                state &&
                                state.isAssigned !== false &&
                                state.daysOfWeek.length > 0 &&
                                canPlaceMissedClassOnTrack(
                                  assignment,
                                  state,
                                  track
                                )
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
                                  (assignment) =>
                                    assignment.deliveryMode === "ONLINE"
                                )
                              ))

                          const trackDays =
                            track === "EVEN" ? EVEN_DAYS : ODD_DAYS

                          const isTeacherTeachingHere = Boolean(
                            activeTeacherFilterId &&
                            cellProposals.some(
                              (p) =>
                                (p.teacherId ?? p.teacher?.id) ===
                                activeTeacherFilterId
                            )
                          )

                          const isTeacherAccessible = Boolean(
                            selectedTeacherCalendar &&
                            !isTeacherTeachingHere &&
                            !selectedTeacherCalendar.slots.some(
                              (s) =>
                                s.status === "BUSY" &&
                                s.source === "EXISTING_CLASS" &&
                                trackDays.includes(s.dayOfWeek) &&
                                s.startTime < slot.endTime &&
                                slot.startTime < s.endTime
                            ) &&
                            selectedTeacherCalendar.slots.some(
                              (s) =>
                                (s.status === "FREE" ||
                                  (s.status === "BUSY" &&
                                    s.source === "PLAN")) &&
                                trackDays.includes(s.dayOfWeek) &&
                                s.startTime <= slot.startTime &&
                                s.endTime >= slot.endTime
                            )
                          )

                          const trackClassesCount =
                            cellProposals.length + cellMissed.length

                          const hasClasses =
                            cellProposals.length > 0 ||
                            cellMissed.length > 0 ||
                            Boolean(moveTarget)

                          return (
                            <CarouselItem
                              key={`${track}-${slot.key}`}
                              data-track-carousel-item="true"
                              className="h-full basis-[88%] ps-2.5 md:basis-full md:ps-0"
                            >
                              <div
                                data-day={track}
                                data-slot={slot.key}
                                data-teacher-accessible={
                                  isTeacherAccessible ? "true" : undefined
                                }
                                data-teacher-teaching={
                                  isTeacherTeachingHere ? "true" : undefined
                                }
                                className={cn(
                                  "flex h-full flex-col justify-between gap-2.5 rounded-xl border p-2.5 transition-all duration-300 ease-in-out",
                                  isTeacherAccessible
                                    ? "border-2 border-success bg-success/5 shadow-xs"
                                    : isTeacherTeachingHere
                                      ? "border-2 border-primary bg-primary/5 shadow-xs"
                                      : "border-border/50 bg-background/50"
                                )}
                              >
                                <div className="flex flex-col gap-2.5">
                                  {/* Header for this vertical view */}
                                  <div className="mb-1 flex items-center justify-between border-b border-border/40 pb-1.5 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-foreground">
                                        {track === "EVEN"
                                          ? t("calendarView.evenDays")
                                          : t("calendarView.oddDays")}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        (
                                        {track === "EVEN"
                                          ? t("calendarView.evenDaysSubtitle")
                                          : t("calendarView.oddDaysSubtitle")}
                                        )
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {isTeacherAccessible && (
                                        <Badge
                                          variant="outline"
                                          data-testid={`teacher-accessible-badge-${track}-${slot.key}`}
                                          className="h-4 border-success/60 bg-success/15 px-1.5 py-0 text-[10px] font-medium text-success-foreground"
                                        >
                                          {t(
                                            "calendarView.teacherAccessibleBadge"
                                          )}
                                        </Badge>
                                      )}
                                      {isTeacherTeachingHere && (
                                        <Badge
                                          variant="outline"
                                          data-testid={`teacher-teaching-badge-${track}-${slot.key}`}
                                          className="h-4 border-primary/60 bg-primary/15 px-1.5 py-0 text-[10px] font-medium text-primary"
                                        >
                                          {t(
                                            "calendarView.teacherTeachingBadge"
                                          )}
                                        </Badge>
                                      )}
                                      {trackClassesCount > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="h-4 px-1.5 py-0 text-[10px]"
                                        >
                                          {t("calendarView.classesCount", {
                                            count: formatNumber(
                                              trackClassesCount,
                                              locale
                                            ),
                                          })}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {hasClasses ? (
                                    <div className="flex flex-col gap-2.5">
                                      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                                        {cellProposals.map((proposal) => {
                                          const isActive =
                                            activeClassId === proposal.id
                                          const isSwappable =
                                            swappableByProposalId.has(
                                              proposal.id
                                            )
                                          const propTeacherId =
                                            proposal.teacherId ??
                                            proposal.teacher?.id ??
                                            null
                                          const hasSameTeacher = Boolean(
                                            (highlightRelated &&
                                              activeTeacherId &&
                                              !isActive &&
                                              propTeacherId ===
                                                activeTeacherId) ||
                                            (activeTeacherFilterId &&
                                              propTeacherId ===
                                                activeTeacherFilterId)
                                          )
                                          const hasSameCourse = Boolean(
                                            highlightRelated &&
                                            (activeCourseId ||
                                              activeCourseTitle) &&
                                            !isActive &&
                                            ((activeCourseId &&
                                              proposal.course?.id ===
                                                activeCourseId) ||
                                              (activeCourseTitle &&
                                                proposal.course?.title ===
                                                  activeCourseTitle))
                                          )
                                          const isDimmed =
                                            isAnyClassActive &&
                                            !isActive &&
                                            (swappingProposalId
                                              ? !isSwappable
                                              : !(
                                                  hasSameTeacher ||
                                                  hasSameCourse
                                                ))
                                          const hasTeacher = Boolean(
                                            proposal.teacherId ||
                                            proposal.teacher
                                          )
                                          const isProposalSwappable =
                                            hasTeacher && isSwappable

                                          return (
                                            <SchedulingPlanCalendarClassCard
                                              key={`${proposal.id}-${track}`}
                                              proposal={proposal}
                                              canEdit={canEdit}
                                              canSwap={canSwap}
                                              isSwapping={
                                                swappingProposalId ===
                                                proposal.id
                                              }
                                              colorIndex={proposalColorMap.get(
                                                proposal.id
                                              )}
                                              isActive={isActive}
                                              isSwappable={isProposalSwappable}
                                              isDimmed={isDimmed}
                                              isCollapsed={isCollapsed}
                                              hasSameTeacher={hasSameTeacher}
                                              hasSameCourse={hasSameCourse}
                                              sameTeacherCount={
                                                isActive
                                                  ? sameTeacherTotalCount
                                                  : undefined
                                              }
                                              sameCourseCount={
                                                isActive
                                                  ? sameCourseTotalCount
                                                  : undefined
                                              }
                                              onClick={handleCardClick}
                                              onRoomClick={
                                                canEdit
                                                  ? (p) =>
                                                      setSwitchRoomProposal(p)
                                                  : undefined
                                              }
                                              onSwapClick={
                                                handleSwapButtonClick
                                              }
                                              onRemoveTeacher={
                                                setTeacherToRemove
                                              }
                                              onChangeDeliveryMode={
                                                handleDeliveryModeChange
                                              }
                                              isDeliveryModePending={
                                                updateDeliveryModeMutation.isPending
                                              }
                                            />
                                          )
                                        })}
                                        {cellMissed.map(
                                          ({ assignment, state }) => {
                                            const hasSameCourse = Boolean(
                                              highlightRelated &&
                                              (activeCourseId ||
                                                activeCourseTitle) &&
                                              ((activeCourseId &&
                                                assignment.course?.id ===
                                                  activeCourseId) ||
                                                (activeCourseTitle &&
                                                  assignment.course?.title ===
                                                    activeCourseTitle))
                                            )
                                            const isDimmed = isAnyClassActive
                                            const effectiveRoomId =
                                              state.classroomId ??
                                              assignment.classroom?.id ??
                                              null
                                            const roomCapacity = effectiveRoomId
                                              ? (knownClassroomsById.get(
                                                  effectiveRoomId
                                                )?.capacity ??
                                                assignment.classroom
                                                  ?.capacity ??
                                                null)
                                              : (assignment.classroom
                                                  ?.capacity ?? null)

                                            return (
                                              <SchedulingPlanCalendarMissedClassCard
                                                key={`${assignment.key}-${track}`}
                                                assignment={assignment}
                                                assignedRoomName={
                                                  state.classroomName ??
                                                  (effectiveRoomId
                                                    ? knownClassroomsById.get(
                                                        effectiveRoomId
                                                      )?.name
                                                    : null) ??
                                                  assignment.classroom?.name ??
                                                  null
                                                }
                                                assignedRoomCapacity={
                                                  roomCapacity
                                                }
                                                canEdit={canEdit}
                                                isActive={false}
                                                isSwappable={false}
                                                isDimmed={isDimmed}
                                                isCollapsed={isCollapsed}
                                                hasSameCourse={hasSameCourse}
                                                sameCourseCount={undefined}
                                                onClick={() =>
                                                  handleMissedCardClick(
                                                    assignment
                                                  )
                                                }
                                                onUnassign={() =>
                                                  onUnassignMissedClass?.(
                                                    assignment.key
                                                  )
                                                }
                                              />
                                            )
                                          }
                                        )}
                                        {moveTarget && (
                                          <SchedulingPlanCalendarMoveTargetCard
                                            track={track}
                                            slotKey={slot.key}
                                            startTime={slot.startTime}
                                            endTime={slot.endTime}
                                            targetDays={moveTarget.targetDays}
                                            targetRoom={moveTarget.targetRoom}
                                            targetTeacher={
                                              moveTarget.targetTeacher
                                            }
                                            teacherStatus={
                                              moveTarget.teacherStatus
                                            }
                                            isPending={
                                              movingProposalId ===
                                              swappingProposal?.id
                                            }
                                            onClick={() =>
                                              handleMoveSession(moveTarget)
                                            }
                                          />
                                        )}
                                      </div>
                                      {canAssignHere && matchingOption && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleOpenAssignDialog(
                                              matchingOption,
                                              freeRooms
                                            )
                                          }
                                          className={cn(
                                            "h-7 w-full gap-1 rounded-lg border border-dashed border-border/60 text-[11px] font-medium text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
                                            isAnyClassActive && "opacity-20"
                                          )}
                                        >
                                          <Plus className="size-3" />
                                          <span>
                                            {t("calendarView.assignClass")}
                                          </span>
                                        </Button>
                                      )}
                                    </div>
                                  ) : canAssignHere && matchingOption ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        handleOpenAssignDialog(
                                          matchingOption,
                                          freeRooms
                                        )
                                      }
                                      className={cn(
                                        "group flex min-h-[84px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed border-primary/50 bg-primary/10 p-3 text-center transition-[background-color,border-color] duration-200 ease-in-out hover:border-primary hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                                        isAnyClassActive && "opacity-20"
                                      )}
                                    >
                                      <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-primary transition-transform duration-200 group-hover:scale-110">
                                        <Plus className="size-4" />
                                      </div>
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-xs font-bold text-primary">
                                          {t("calendarView.freeSlot")}
                                        </span>
                                        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary">
                                          {t("calendarView.assignClass")}
                                        </span>
                                      </div>
                                    </Button>
                                  ) : (
                                    <div
                                      data-testid={`empty-cell-${track}-${slot.key}`}
                                      className={cn(
                                        "flex min-h-[84px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-border/50 bg-muted/15 p-3 text-center transition-[opacity,background-color] duration-200 ease-in-out select-none hover:bg-muted/25",
                                        isAnyClassActive
                                          ? "opacity-20"
                                          : "opacity-40"
                                      )}
                                      aria-label={t("calendarView.noClasses")}
                                    >
                                      <div className="flex size-7 items-center justify-center rounded-full bg-muted/30 text-muted-foreground/70">
                                        <CalendarX2
                                          aria-hidden
                                          className="size-4 text-muted-foreground/70"
                                        />
                                      </div>
                                      <span className="text-[11px] font-medium text-muted-foreground/80">
                                        {t("calendarView.noClasses")}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <SchedulingPlanCalendarGroupTeachersCarousel
                                  className="mt-auto"
                                  track={track}
                                  slotKey={slot.key}
                                  teachers={
                                    groupTeachersByTrackAndSlot.get(cellKey) ??
                                    []
                                  }
                                  isCollapsed={isCollapsed}
                                  onSelectTeacher={(teacherId) => {
                                    handleTeacherChange(
                                      activeTeacherFilterId === teacherId
                                        ? null
                                        : teacherId
                                    )
                                  }}
                                  onSwapWithTeacher={(target, evaluation) => {
                                    if (swappingProposal) {
                                      setSwapDialogState({
                                        sourceProposal: swappingProposal,
                                        target,
                                        evaluation,
                                      })
                                    }
                                  }}
                                />
                              </div>
                            </CarouselItem>
                          )
                        })}
                      </CarouselContent>
                    </Carousel>
                  </div>
                </div>
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

      {/* Staffing Fallback Dialog */}
      <StaffingFallbackDialog
        open={Boolean(staffingDialogSession)}
        onOpenChange={(open) => {
          if (!open) setStaffingDialogSession(null)
        }}
        fallback={staffingDialogSession?.fallback}
        targetCourseTitle={staffingDialogSession?.courseTitle ?? ""}
        hiringAssignments={staffingDialogSession?.hiringAssignments ?? []}
        planId={planId}
        planStatus={planStatus}
        unresolvedRequirementId={staffingDialogSession?.unresolvedRequirementId}
        requirement={staffingDialogSession?.requirement}
      />

      {/* Switch / Swap Room Dialog */}
      <SwitchRoomDialog
        open={Boolean(switchRoomProposal)}
        onOpenChange={(open) => {
          if (!open) setSwitchRoomProposal(null)
        }}
        proposal={switchRoomProposal}
        classrooms={instituteClassrooms}
        proposals={allSwappableProposals}
        onSwitchRoom={handleSwitchRoom}
        isPending={updateProposalMutation.isPending}
      />

      {/* Remove Teacher Confirmation Dialog */}
      <AlertDialog
        open={Boolean(teacherToRemove)}
        onOpenChange={(open) => {
          if (!open && !removeTeacherMutation.isPending) {
            setTeacherToRemove(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("calendarView.removeTeacherTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {teacherToRemove &&
                t("calendarView.removeTeacherDescription", {
                  teacher: teacherToRemove.teacher
                    ? `${teacherToRemove.teacher.firstName} ${teacherToRemove.teacher.lastName}`.trim()
                    : t("calendarView.newTeacherBadge"),
                  course: teacherToRemove.course.title,
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeTeacherMutation.isPending}>
              {t("calendarView.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeTeacherMutation.isPending}
              onClick={handleConfirmRemoveTeacher}
            >
              {removeTeacherMutation.isPending && (
                <Spinner data-icon="inline-start" className="size-4" />
              )}
              {t("calendarView.confirmRemoveTeacher")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
