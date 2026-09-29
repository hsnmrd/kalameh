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
  classroomId: string
  daysOfWeek: WeekDay[]
  startTime: string
  endTime: string
}

const ALL_FLAG_COMBINATIONS: readonly SwapCombinationFlags[] = [
  { changeTeacher: true, changeClassroom: false, changeDate: false },
  { changeTeacher: false, changeClassroom: true, changeDate: false },
  { changeTeacher: true, changeClassroom: true, changeDate: false },
  { changeTeacher: false, changeClassroom: true, changeDate: true },
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

  const hasDifferentTeacher =
    Boolean(sourceTeacherId && targetTeacherId) &&
    sourceTeacherId !== targetTeacherId
  const hasDifferentClassroom =
    source.deliveryMode === "IN_PERSON" &&
    target.deliveryMode === "IN_PERSON" &&
    Boolean(sourceClassroomId && targetClassroomId) &&
    sourceClassroomId !== targetClassroomId
  const hasDifferentDate =
    source.startTime !== target.startTime ||
    source.endTime !== target.endTime ||
    !haveSameDays(source.daysOfWeek, target.daysOfWeek)

  const validCombinations = ALL_FLAG_COMBINATIONS.filter((flags) => {
    if (flags.changeTeacher && !hasDifferentTeacher) return false
    if (flags.changeClassroom && !hasDifferentClassroom) return false
    if (flags.changeDate && !hasDifferentDate) return false
    if (flags.changeTeacher && flags.changeDate) return false
    if (flags.changeClassroom && !flags.changeDate && hasDifferentDate) {
      return false
    }
    if (flags.changeDate && hasDifferentClassroom && !flags.changeClassroom) {
      return false
    }

    const swapsAllDifferingAttributes =
      (!hasDifferentTeacher || flags.changeTeacher) &&
      (!hasDifferentClassroom || flags.changeClassroom) &&
      (!hasDifferentDate || flags.changeDate)
    if (source.course.id === target.course.id && swapsAllDifferingAttributes) {
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

  const canChangeTeacher = validCombinations.some((c) => c.changeTeacher)
  const canChangeClassroom = validCombinations.some((c) => c.changeClassroom)
  const canChangeDate = validCombinations.some((c) => c.changeDate)

  return {
    canSwap: true,
    validCombinations,
    canChangeTeacher,
    canChangeClassroom,
    canChangeDate,
    defaultSelection: validCombinations[0]!,
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

  const allCourses = collectKnownCourses(allProposals, teacherCalendars)

  if (flags.changeTeacher) {
    if (!nextSourceTeacherId || !nextTargetTeacherId) return false
    if (
      !isTeacherQualifiedForCourse(
        nextSourceTeacherId,
        source.course,
        allProposals,
        teacherCalendars,
        allCourses
      ) ||
      !isTeacherQualifiedForCourse(
        nextTargetTeacherId,
        target.course,
        allProposals,
        teacherCalendars,
        allCourses
      )
    ) {
      return false
    }
  }

  if (flags.changeClassroom) {
    if (
      source.deliveryMode === "IN_PERSON" &&
      (!nextSourceClassroom || nextSourceClassroom.capacity < source.capacity)
    ) {
      return false
    }
    if (
      target.deliveryMode === "IN_PERSON" &&
      (!nextTargetClassroom || nextTargetClassroom.capacity < target.capacity)
    ) {
      return false
    }
    const sourceBranchId = getProposalBranchId(source)
    const targetBranchId = getProposalBranchId(target)
    if (sourceBranchId && targetBranchId && sourceBranchId !== targetBranchId) {
      return false
    }
  }

  const ignoredIds = [source.id, target.id]

  if (flags.changeTeacher || flags.changeDate) {
    if (
      nextSourceTeacherId &&
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
    if (
      nextTargetTeacherId &&
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

  if (flags.changeClassroom || flags.changeDate) {
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

  return true
}

function isTeacherQualifiedForCourse(
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

function isTeacherAvailableForSchedule(
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
        slot.status === "FREE" &&
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
      slot.classroomId === classroomId &&
      slot.daysOfWeek.some((day) => daysOfWeek.includes(day)) &&
      slot.startTime < endTime &&
      startTime < slot.endTime
  )
  return !hasOccupiedSlotConflict
}

function collectKnownCourses(
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
