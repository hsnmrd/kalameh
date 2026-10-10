import {
  findHigherLevelCourse,
  type SchedulingPlanDetailsDto,
  type SchedulingTeacherCalendar,
  type WeekDay,
} from "@workspace/types"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface SwapCombinationFlags {
  changeTeacher: boolean
  changeClassroom: boolean
  changeDate: boolean
}

export interface FreeTeacherSwapTarget {
  kind: "FREE_TEACHER"
  teacher: SchedulingTeacherCalendar["teacher"]
  teachableCourses: SchedulingTeacherCalendar["teachableCourses"]
  levelRange: string | null
  dayOfWeek: WeekDay
  startTime: string
  endTime: string
}

export interface ProposalSwapTarget {
  kind: "PROPOSAL"
  proposal: Proposal
}

export type SwapTarget = ProposalSwapTarget | FreeTeacherSwapTarget

export interface SwapEvaluationResult {
  canSwap: boolean
  validCombinations: SwapCombinationFlags[]
  canChangeTeacher: boolean
  canChangeClassroom: boolean
  canChangeDate: boolean
  defaultSelection: SwapCombinationFlags
}

export interface OccupiedClassroomSlot {
  id?: string
  classroomId: string
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
}

const ALL_FLAG_COMBINATIONS: readonly SwapCombinationFlags[] = [
  // 1. Same-slot swaps:
  { changeTeacher: true, changeClassroom: false, changeDate: false },
  { changeTeacher: false, changeClassroom: true, changeDate: false },
  { changeTeacher: true, changeClassroom: true, changeDate: false },
  // 2. Full session/slot swap: Courses exchange slots, keeping master and room in their respective slots
  { changeTeacher: true, changeClassroom: true, changeDate: true },
  // 3. Move date with classroom (keep master):
  { changeTeacher: false, changeClassroom: true, changeDate: true },
  // 4. Move date with master (keep classroom):
  { changeTeacher: true, changeClassroom: false, changeDate: true },
  // 5. Move date with both master and classroom:
  { changeTeacher: false, changeClassroom: false, changeDate: true },
]

export function getProposalTeacherId(proposal: Proposal): string | null {
  return proposal.teacherId ?? proposal.teacher?.id ?? null
}

export function getProposalClassroomId(proposal: Proposal): string | null {
  return proposal.classroomId ?? proposal.classroom?.id ?? null
}

export function getProposalBranchId(proposal: Proposal): string | null {
  return proposal.branchId ?? proposal.branch?.id ?? null
}

export function evaluateProposalSwap(
  source: Proposal,
  target: Proposal,
  allProposals: Proposal[],
  teacherCalendars?: SchedulingTeacherCalendar[],
  occupiedClassroomSlots?: OccupiedClassroomSlot[]
): SwapEvaluationResult {
  const emptyResult: SwapEvaluationResult = {
    canSwap: false,
    validCombinations: [],
    canChangeTeacher: false,
    canChangeClassroom: false,
    canChangeDate: false,
    defaultSelection: {
      changeTeacher: false,
      changeClassroom: false,
      changeDate: false,
    },
  }

  if (
    source.id === target.id ||
    source.isLocked ||
    target.isLocked ||
    Boolean(source.publishedClassId) ||
    Boolean(target.publishedClassId)
  ) {
    return emptyResult
  }

  const sourceTeacherId = getProposalTeacherId(source)
  const targetTeacherId = getProposalTeacherId(target)
  const sourceClassroomId = getProposalClassroomId(source)
  const targetClassroomId = getProposalClassroomId(target)

  const canSwapTeacher =
    Boolean(sourceTeacherId || targetTeacherId) &&
    sourceTeacherId !== targetTeacherId
  const hasDifferentTeacher = sourceTeacherId !== targetTeacherId
  const hasDifferentClassroom =
    source.deliveryMode === "IN_PERSON" &&
    target.deliveryMode === "IN_PERSON" &&
    sourceClassroomId !== targetClassroomId
  const hasDifferentDate =
    source.startTime !== target.startTime ||
    source.endTime !== target.endTime ||
    !haveSameDays(source.daysOfWeek, target.daysOfWeek)

  const isSameCourse = source.course.id === target.course.id

  const validCombinations = ALL_FLAG_COMBINATIONS.filter((flags) => {
    if (flags.changeTeacher && !canSwapTeacher) return false
    if (flags.changeClassroom && !hasDifferentClassroom) return false
    if (flags.changeDate && !hasDifferentDate) return false
    if (flags.changeClassroom && !flags.changeDate && hasDifferentDate) {
      return false
    }

    const swapsAllDifferingAttributes =
      (!hasDifferentTeacher || flags.changeTeacher) &&
      (!hasDifferentClassroom || flags.changeClassroom) &&
      (!hasDifferentDate || flags.changeDate)

    // Swapping all differing attributes for two classes of the exact same course
    // is an identity no-op (exchanging identical classes).
    if (isSameCourse && swapsAllDifferingAttributes) {
      return false
    }

    return isProposalCombinationValid(
      source,
      target,
      flags,
      allProposals,
      teacherCalendars,
      occupiedClassroomSlots
    )
  })

  if (validCombinations.length === 0) return emptyResult

  const isTargetRoomOccupiedAtSourceTime =
    source.deliveryMode === "IN_PERSON" &&
    Boolean(targetClassroomId) &&
    !isClassroomAvailableForSchedule(
      targetClassroomId,
      source.deliveryMode,
      source.daysOfWeek,
      source.startTime,
      source.endTime,
      [source.id, target.id],
      allProposals,
      occupiedClassroomSlots
    )

  const isSourceRoomOccupiedAtTargetTime =
    target.deliveryMode === "IN_PERSON" &&
    Boolean(sourceClassroomId) &&
    !isClassroomAvailableForSchedule(
      sourceClassroomId,
      target.deliveryMode,
      target.daysOfWeek,
      target.startTime,
      target.endTime,
      [source.id, target.id],
      allProposals,
      occupiedClassroomSlots
    )

  const canChangeTeacher =
    hasDifferentTeacher && validCombinations.some((c) => c.changeTeacher)
  const canChangeClassroom =
    hasDifferentClassroom &&
    !isTargetRoomOccupiedAtSourceTime &&
    !isSourceRoomOccupiedAtTargetTime &&
    validCombinations.some((c) => c.changeClassroom)
  const canChangeDate =
    hasDifferentDate && validCombinations.some((c) => c.changeDate)

  const preferredDefault = isSameCourse
    ? (validCombinations.find(
        (c) => c.changeTeacher && !c.changeDate && !c.changeClassroom
      ) ??
      validCombinations.find((c) => c.changeTeacher) ??
      validCombinations[0]!)
    : hasDifferentDate
      ? (validCombinations.find(
          (c) => c.changeDate && c.changeTeacher && c.changeClassroom
        ) ??
        validCombinations.find((c) => c.changeDate) ??
        validCombinations[0]!)
      : validCombinations[0]!

  return {
    canSwap: true,
    validCombinations,
    canChangeTeacher,
    canChangeClassroom,
    canChangeDate,
    defaultSelection: preferredDefault,
  }
}

export function evaluateFreeTeacherSwap(
  source: Proposal,
  freeTeacher: FreeTeacherSwapTarget,
  allProposals: Proposal[],
  teacherCalendars?: SchedulingTeacherCalendar[],
  occupiedClassroomSlots?: OccupiedClassroomSlot[]
): SwapEvaluationResult {
  const emptyResult: SwapEvaluationResult = {
    canSwap: false,
    validCombinations: [],
    canChangeTeacher: false,
    canChangeClassroom: false,
    canChangeDate: false,
    defaultSelection: {
      changeTeacher: false,
      changeClassroom: false,
      changeDate: false,
    },
  }

  const sourceTeacherId = getProposalTeacherId(source)
  const sourceClassroomId = getProposalClassroomId(source)

  if (
    source.id.startsWith("missed:") ||
    source.isLocked ||
    Boolean(source.publishedClassId) ||
    sourceTeacherId === freeTeacher.teacher.id
  ) {
    return emptyResult
  }

  const allCourses = collectKnownCourses(allProposals, teacherCalendars)
  if (
    !isTeacherQualifiedForCourse(
      freeTeacher.teacher.id,
      source.course,
      allProposals,
      teacherCalendars,
      allCourses,
      freeTeacher.teachableCourses
    )
  ) {
    return emptyResult
  }

  const validCombinations: SwapCombinationFlags[] = []

  // Option 1: Change teacher at source's current days & time
  const isSameSlotAsSource =
    source.daysOfWeek.includes(freeTeacher.dayOfWeek) &&
    source.startTime === freeTeacher.startTime &&
    source.endTime === freeTeacher.endTime

  if (
    isSameSlotAsSource &&
    isTeacherAvailableForSchedule(
      freeTeacher.teacher.id,
      source.daysOfWeek,
      source.startTime,
      source.endTime,
      [source.id],
      allProposals,
      teacherCalendars
    )
  ) {
    validCombinations.push({
      changeTeacher: true,
      changeClassroom: false,
      changeDate: false,
    })
  }

  // Option 2: If clicked free teacher card is in a different time slot, check if moving source to that time slot + teacher is valid
  const targetDays = resolveTrackDaysForWeekday(
    freeTeacher.dayOfWeek,
    source.daysOfWeek
  )
  const isDifferentSlot =
    source.startTime !== freeTeacher.startTime ||
    source.endTime !== freeTeacher.endTime ||
    !haveSameDays(source.daysOfWeek, targetDays)

  if (
    isDifferentSlot &&
    isTeacherAvailableForSchedule(
      freeTeacher.teacher.id,
      targetDays,
      freeTeacher.startTime,
      freeTeacher.endTime,
      [source.id],
      allProposals,
      teacherCalendars
    ) &&
    isClassroomAvailableForSchedule(
      sourceClassroomId,
      source.deliveryMode,
      targetDays,
      freeTeacher.startTime,
      freeTeacher.endTime,
      [source.id],
      allProposals,
      occupiedClassroomSlots
    )
  ) {
    validCombinations.push({
      changeTeacher: true,
      changeClassroom: false,
      changeDate: true,
    })
  }

  if (validCombinations.length === 0) return emptyResult

  return {
    canSwap: true,
    validCombinations,
    canChangeTeacher: validCombinations.some((c) => c.changeTeacher),
    canChangeClassroom: false,
    canChangeDate: validCombinations.some((c) => c.changeDate),
    defaultSelection: validCombinations[0]!,
  }
}

export function isCombinationValid(
  evaluation: SwapEvaluationResult,
  flags: SwapCombinationFlags
): boolean {
  return evaluation.validCombinations.some(
    (combo) =>
      combo.changeTeacher === flags.changeTeacher &&
      combo.changeClassroom === flags.changeClassroom &&
      combo.changeDate === flags.changeDate
  )
}

export function resolveFreeTeacherTargetDays(
  source: Proposal,
  freeTeacher: FreeTeacherSwapTarget
): WeekDay[] {
  return resolveTrackDaysForWeekday(freeTeacher.dayOfWeek, source.daysOfWeek)
}

function isProposalCombinationValid(
  source: Proposal,
  target: Proposal,
  flags: SwapCombinationFlags,
  allProposals: Proposal[],
  teacherCalendars?: SchedulingTeacherCalendar[],
  occupiedClassroomSlots?: OccupiedClassroomSlot[]
): boolean {
  const sourceTeacherId = getProposalTeacherId(source)
  const targetTeacherId = getProposalTeacherId(target)
  const sourceClassroomId = getProposalClassroomId(source)
  const targetClassroomId = getProposalClassroomId(target)

  const nextSourceTeacherId = flags.changeTeacher
    ? targetTeacherId
    : sourceTeacherId
  const nextTargetTeacherId = flags.changeTeacher
    ? sourceTeacherId
    : targetTeacherId

  const nextSourceClassroom = flags.changeClassroom
    ? target.classroom
    : source.classroom
  const nextSourceClassroomId = flags.changeClassroom
    ? targetClassroomId
    : sourceClassroomId
  const nextTargetClassroom = flags.changeClassroom
    ? source.classroom
    : target.classroom
  const nextTargetClassroomId = flags.changeClassroom
    ? sourceClassroomId
    : targetClassroomId

  const nextSourceDays = flags.changeDate
    ? target.daysOfWeek
    : source.daysOfWeek
  const nextSourceStart = flags.changeDate ? target.startTime : source.startTime
  const nextSourceEnd = flags.changeDate ? target.endTime : source.endTime

  const nextTargetDays = flags.changeDate
    ? source.daysOfWeek
    : target.daysOfWeek
  const nextTargetStart = flags.changeDate ? source.startTime : target.startTime
  const nextTargetEnd = flags.changeDate ? source.endTime : target.endTime

  const sourceBranchId = getProposalBranchId(source)
  const targetBranchId = getProposalBranchId(target)
  if (sourceBranchId && targetBranchId && sourceBranchId !== targetBranchId) {
    return false
  }

  // Ensure the two resulting classes do not conflict with each other
  const schedulesOverlap =
    nextSourceDays.some((day) => nextTargetDays.includes(day)) &&
    nextSourceStart < nextTargetEnd &&
    nextTargetStart < nextSourceEnd

  if (schedulesOverlap) {
    if (nextSourceTeacherId && nextSourceTeacherId === nextTargetTeacherId) {
      return false
    }
    if (
      source.deliveryMode === "IN_PERSON" &&
      target.deliveryMode === "IN_PERSON" &&
      nextSourceClassroomId &&
      nextSourceClassroomId === nextTargetClassroomId
    ) {
      return false
    }
  }

  const ignoredIds = [source.id, target.id]
  const isSameCourse = source.course.id === target.course.id

  // Full session/slot swap: courses exchange slots, keeping teachers & rooms in their respective time slots.
  // Neither teacher nor room changes time slot, so availability/occupancy does not conflict.
  // Capacity and qualification are not blockers (can be manually managed by supervisor).
  const isFullSessionSwap =
    flags.changeDate && flags.changeTeacher && flags.changeClassroom

  if (isFullSessionSwap) {
    return true
  }

  // Teacher availability check:
  // When moving a teacher to a DIFFERENT time slot (e.g. same-course teacher swap across dates,
  // or moving dates without swapping teachers), ensure teacher is available in destination slot.
  const sourceTeacherMovesSlot =
    (flags.changeDate && !flags.changeTeacher) ||
    (!flags.changeDate && flags.changeTeacher && isSameCourse)
  const targetTeacherMovesSlot =
    (flags.changeDate && !flags.changeTeacher) ||
    (!flags.changeDate && flags.changeTeacher && isSameCourse)

  if (sourceTeacherMovesSlot && nextSourceTeacherId) {
    if (
      !isTeacherAvailableForSchedule(
        nextSourceTeacherId,
        nextSourceDays,
        nextSourceStart,
        nextSourceEnd,
        ignoredIds,
        allProposals,
        teacherCalendars
      )
    ) {
      return false
    }
  }

  if (targetTeacherMovesSlot && nextTargetTeacherId) {
    if (
      !isTeacherAvailableForSchedule(
        nextTargetTeacherId,
        nextTargetDays,
        nextTargetStart,
        nextTargetEnd,
        ignoredIds,
        allProposals,
        teacherCalendars
      )
    ) {
      return false
    }
  }

  // Physical room availability check:
  // When moving a physical classroom to a DIFFERENT time slot (changeDate is true, but changeClassroom is false),
  // ensure the physical room is not already occupied in that time slot.
  const roomMovesSlot = flags.changeDate && !flags.changeClassroom
  if (roomMovesSlot) {
    if (
      !isClassroomAvailableForSchedule(
        nextSourceClassroomId,
        source.deliveryMode,
        nextSourceDays,
        nextSourceStart,
        nextSourceEnd,
        ignoredIds,
        allProposals,
        occupiedClassroomSlots
      ) ||
      !isClassroomAvailableForSchedule(
        nextTargetClassroomId,
        target.deliveryMode,
        nextTargetDays,
        nextTargetStart,
        nextTargetEnd,
        ignoredIds,
        allProposals,
        occupiedClassroomSlots
      )
    ) {
      return false
    }
  }

  return true
}

export interface TargetTeacherResolution {
  targetTeacher: SchedulingTeacherCalendar["teacher"] | null
  teacherStatus: "SAME_TEACHER" | "REASSIGNED_TEACHER" | "UNASSIGNED"
}

export function resolveTargetTeacherForSlot(
  sourceProposal: Proposal,
  targetDays: WeekDay[],
  startTime: string,
  endTime: string,
  allProposals: Proposal[],
  teacherCalendars?: SchedulingTeacherCalendar[]
): TargetTeacherResolution {
  const currentTeacherId = getProposalTeacherId(sourceProposal)
  const currentTeacher = sourceProposal.teacher ?? null

  // 1. If current teacher exists and is available in target slot, keep them
  if (currentTeacherId) {
    const isCurrentTeacherAvailable = isTeacherAvailableForSchedule(
      currentTeacherId,
      targetDays,
      startTime,
      endTime,
      [sourceProposal.id],
      allProposals,
      teacherCalendars
    )
    if (isCurrentTeacherAvailable) {
      return {
        targetTeacher: currentTeacher,
        teacherStatus: "SAME_TEACHER",
      }
    }
  }

  // 2. Current teacher is not available (or was null). Search for qualified free teachers in target period
  if (teacherCalendars && teacherCalendars.length > 0) {
    const allCourses = collectKnownCourses(allProposals, teacherCalendars)
    const qualifiedFreeTeachers: SchedulingTeacherCalendar["teacher"][] = []

    for (const calendar of teacherCalendars) {
      if (currentTeacherId && calendar.teacher.id === currentTeacherId) {
        continue
      }
      const isQualified = isTeacherQualifiedForCourse(
        calendar.teacher.id,
        sourceProposal.course,
        allProposals,
        teacherCalendars,
        allCourses
      )
      if (!isQualified) continue

      const isAvailable = isTeacherAvailableForSchedule(
        calendar.teacher.id,
        targetDays,
        startTime,
        endTime,
        [sourceProposal.id],
        allProposals,
        teacherCalendars
      )
      if (isAvailable) {
        qualifiedFreeTeachers.push(calendar.teacher)
      }
    }

    if (qualifiedFreeTeachers.length > 0) {
      return {
        targetTeacher: qualifiedFreeTeachers[0]!,
        teacherStatus: "REASSIGNED_TEACHER",
      }
    }
  }

  // 3. No qualified free teacher available. Keep teacher field empty.
  return {
    targetTeacher: null,
    teacherStatus: "UNASSIGNED",
  }
}

export function isTeacherQualifiedForCourse(
  teacherId: string,
  targetCourse: { id: string; title: string },
  allProposals: Proposal[],
  teacherCalendars?: SchedulingTeacherCalendar[],
  allCourses: Array<{ id: string; title: string }> = [],
  explicitCourses?: Array<{ id: string; title: string }>
): boolean {
  const calendar = teacherCalendars?.find((c) => c.teacher.id === teacherId)
  const proposalCourses = allProposals
    .filter((p) => getProposalTeacherId(p) === teacherId)
    .map((p) => p.course)
  const teacherCourses = [
    ...(explicitCourses ?? []),
    ...(calendar?.teachableCourses ?? []),
    ...proposalCourses,
  ]

  if (teacherCourses.some((c) => c.id === targetCourse.id)) {
    return true
  }

  return Boolean(
    findHigherLevelCourse(targetCourse, teacherCourses, allCourses)
  )
}

export function isTeacherAvailableForSchedule(
  teacherId: string,
  daysOfWeek: WeekDay[],
  startTime: string,
  endTime: string,
  ignoredProposalIds: string[],
  allProposals: Proposal[],
  teacherCalendars?: SchedulingTeacherCalendar[]
): boolean {
  const ignored = new Set(ignoredProposalIds)

  // Check conflicts against other active proposals in the plan
  const hasProposalConflict = allProposals.some(
    (proposal) =>
      !ignored.has(proposal.id) &&
      getProposalTeacherId(proposal) === teacherId &&
      proposal.daysOfWeek.some((day) => daysOfWeek.includes(day)) &&
      proposal.startTime < endTime &&
      startTime < proposal.endTime
  )
  if (hasProposalConflict) return false

  const calendar = teacherCalendars?.find((c) => c.teacher.id === teacherId)
  if (!calendar) {
    return true
  }

  const hasExistingClassConflict = calendar.slots.some(
    (slot) =>
      slot.status === "BUSY" &&
      slot.source === "EXISTING_CLASS" &&
      daysOfWeek.includes(slot.dayOfWeek) &&
      slot.startTime < endTime &&
      startTime < slot.endTime
  )
  if (hasExistingClassConflict) return false

  return daysOfWeek.every((day) => {
    const coveredBySwapSource = allProposals.some(
      (proposal) =>
        ignored.has(proposal.id) &&
        getProposalTeacherId(proposal) === teacherId &&
        proposal.daysOfWeek.includes(day) &&
        proposal.startTime <= startTime &&
        proposal.endTime >= endTime
    )
    if (coveredBySwapSource) return true

    return calendar.slots.some(
      (slot) =>
        (slot.status === "FREE" ||
          (slot.status === "BUSY" && slot.source === "PLAN")) &&
        slot.dayOfWeek === day &&
        slot.startTime <= startTime &&
        slot.endTime >= endTime
    )
  })
}

function isClassroomAvailableForSchedule(
  classroomId: string | null,
  deliveryMode: "IN_PERSON" | "ONLINE",
  daysOfWeek: WeekDay[],
  startTime: string,
  endTime: string,
  ignoredProposalIds: string[],
  allProposals: Proposal[],
  occupiedClassroomSlots?: OccupiedClassroomSlot[]
): boolean {
  if (deliveryMode === "ONLINE") return true
  if (!classroomId) return false
  const ignored = new Set(ignoredProposalIds)

  const hasProposalConflict = allProposals.some(
    (proposal) =>
      !ignored.has(proposal.id) &&
      proposal.deliveryMode === "IN_PERSON" &&
      getProposalClassroomId(proposal) === classroomId &&
      proposal.daysOfWeek.some((day) => daysOfWeek.includes(day)) &&
      proposal.startTime < endTime &&
      startTime < proposal.endTime
  )
  if (hasProposalConflict) return false

  const hasOccupiedSlotConflict = (occupiedClassroomSlots ?? []).some(
    (slot) =>
      (!slot.id || !ignored.has(slot.id)) &&
      slot.classroomId === classroomId &&
      slot.daysOfWeek.some((day) => daysOfWeek.includes(day)) &&
      slot.startTime < endTime &&
      startTime < slot.endTime
  )
  return !hasOccupiedSlotConflict
}

export function collectKnownCourses(
  allProposals: Proposal[],
  teacherCalendars?: SchedulingTeacherCalendar[]
): Array<{ id: string; title: string }> {
  const map = new Map<string, { id: string; title: string }>()
  for (const proposal of allProposals) {
    map.set(proposal.course.id, proposal.course)
  }
  for (const calendar of teacherCalendars ?? []) {
    for (const course of calendar.teachableCourses ?? []) {
      map.set(course.id, course)
    }
  }
  return Array.from(map.values())
}

function haveSameDays(left: WeekDay[], right: WeekDay[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((day) => rightSet.has(day))
}

function resolveTrackDaysForWeekday(
  clickedDay: WeekDay,
  sourceDays: WeekDay[]
): WeekDay[] {
  if (sourceDays.length <= 1) return [clickedDay]
  const evenTrack: WeekDay[] = ["SATURDAY", "MONDAY", "WEDNESDAY"]
  const oddTrack: WeekDay[] = ["SUNDAY", "TUESDAY", "THURSDAY"]
  if (evenTrack.includes(clickedDay)) return evenTrack
  if (oddTrack.includes(clickedDay)) return oddTrack
  return [clickedDay]
}
