import type { SchedulingPlanDetailsDto, WeekDay } from "@workspace/types"
import type { OccupiedClassroomSlot } from "./swap-eligibility.helper"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export interface ClassroomOption {
  id: string
  name: string
  capacity: number
  branchId?: string | null
}

export interface InnerPeriodClassroomReassignment {
  proposal: Proposal
  fromClassroomId: string | null
  toClassroom: ClassroomOption
}

export interface PeriodClassroomResolution {
  assignedClassroom: ClassroomOption | null
  innerReassignments: InnerPeriodClassroomReassignment[]
}

export interface SessionSwapExecutionPlan {
  sourceProposalId: string
  sourceNewDays: WeekDay[]
  sourceNewStartTime: string
  sourceNewEndTime: string
  sourceNewClassroom: ClassroomOption | null
  sourceNewTeacherId: null

  targetProposalId: string
  targetNewDays: WeekDay[]
  targetNewStartTime: string
  targetNewEndTime: string
  targetNewClassroom: ClassroomOption | null
  targetNewTeacherId: null

  innerReassignments: InnerPeriodClassroomReassignment[]
}

export function doPeriodsOverlap(
  p1Days: WeekDay[],
  p1Start: string,
  p1End: string,
  p2Days: WeekDay[],
  p2Start: string,
  p2End: string
): boolean {
  const shareDay = p1Days.some((d) => p2Days.includes(d))
  if (!shareDay) return false
  return p1Start < p2End && p2Start < p1End
}

/**
 * Resolves classroom assignment for a session entering a specific period.
 * Automatically finds a suitable free classroom. If the only free classroom
 * does not have enough capacity, it checks existing concurrent sessions in that
 * period and swaps classrooms with an existing session whose students can fit
 * into the free classroom, freeing up the larger classroom for the incoming session.
 */
export function resolvePeriodClassroomAssignment(
  incomingSession: Proposal,
  outgoingSessionId: string,
  period: { daysOfWeek: WeekDay[]; startTime: string; endTime: string },
  allProposals: Proposal[],
  classrooms: ClassroomOption[],
  occupiedSlots?: OccupiedClassroomSlot[]
): PeriodClassroomResolution {
  if (incomingSession.deliveryMode === "ONLINE") {
    return { assignedClassroom: null, innerReassignments: [] }
  }

  // Filter classrooms by branch if incoming session is tied to a branch
  const candidateRooms = classrooms.filter((room) => {
    if (!incomingSession.branchId || !room.branchId) return true
    return room.branchId === incomingSession.branchId
  })

  // Find concurrent in-person sessions in this period (excluding incoming and outgoing)
  const concurrentSessions = allProposals.filter((p) => {
    if (p.id === outgoingSessionId || p.id === incomingSession.id) return false
    if (p.deliveryMode !== "IN_PERSON") return false
    return doPeriodsOverlap(
      p.daysOfWeek,
      p.startTime,
      p.endTime,
      period.daysOfWeek,
      period.startTime,
      period.endTime
    )
  })

  // Find rooms occupied by concurrent sessions
  const occupiedRoomIds = new Set<string>()
  for (const session of concurrentSessions) {
    const rid = session.classroomId ?? session.classroom?.id
    if (rid) {
      occupiedRoomIds.add(rid)
    }
  }

  // Also account for external occupied slots (e.g. active classes outside proposals)
  if (occupiedSlots) {
    for (const slot of occupiedSlots) {
      if (
        slot.id &&
        (slot.id === outgoingSessionId || slot.id === incomingSession.id)
      ) {
        continue
      }
      const overlaps = doPeriodsOverlap(
        slot.daysOfWeek,
        slot.startTime,
        slot.endTime,
        period.daysOfWeek,
        period.startTime,
        period.endTime
      )
      if (overlaps) {
        occupiedRoomIds.add(slot.classroomId)
      }
    }
  }

  // Free classrooms in this period
  const freeRooms = candidateRooms.filter(
    (room) => !occupiedRoomIds.has(room.id)
  )

  // Prefer the vacated room of the outgoing session if it has sufficient capacity
  const outgoingSession = allProposals.find((p) => p.id === outgoingSessionId)
  const outgoingRoomId =
    outgoingSession?.classroomId ?? outgoingSession?.classroom?.id
  const vacatedRoom = outgoingRoomId
    ? candidateRooms.find((r) => r.id === outgoingRoomId)
    : null

  if (
    vacatedRoom &&
    freeRooms.some((r) => r.id === vacatedRoom.id) &&
    vacatedRoom.capacity >= incomingSession.capacity
  ) {
    return { assignedClassroom: vacatedRoom, innerReassignments: [] }
  }

  // Strategy 1: Direct assignment if any free room has sufficient capacity
  const suitableFreeRooms = freeRooms.filter(
    (room) => room.capacity >= incomingSession.capacity
  )
  if (suitableFreeRooms.length > 0) {
    // Pick the best-fit free room (smallest capacity that is >= incoming capacity)
    const bestRoom = [...suitableFreeRooms].sort(
      (a, b) => a.capacity - b.capacity
    )[0]!
    return { assignedClassroom: bestRoom, innerReassignments: [] }
  }

  // Strategy 2: Deep period check - swap classroom with a concurrent session in this period!
  // Find a concurrent session whose current room has capacity >= incomingSession.capacity,
  // AND whose required students can fit into one of the free rooms in this period.
  interface RebalanceCandidate {
    concurrentSession: Proposal
    concurrentRoom: ClassroomOption
    freeRoomForConcurrent: ClassroomOption
    waste: number
  }

  const candidates: RebalanceCandidate[] = []

  for (const concurrentSession of concurrentSessions) {
    const currentRoomId =
      concurrentSession.classroomId ?? concurrentSession.classroom?.id
    if (!currentRoomId) continue

    const currentRoom = candidateRooms.find((r) => r.id === currentRoomId)
    if (!currentRoom || currentRoom.capacity < incomingSession.capacity) {
      continue
    }

    // Current room can accommodate the incoming session.
    // Check if any free room can accommodate this concurrent session:
    const suitableFreeForConcurrent = freeRooms.filter(
      (fr) => fr.capacity >= concurrentSession.capacity
    )
    if (suitableFreeForConcurrent.length > 0) {
      const bestFreeForConcurrent = [...suitableFreeForConcurrent].sort(
        (a, b) => a.capacity - b.capacity
      )[0]!

      // Total excess capacity (waste)
      const waste =
        currentRoom.capacity -
        incomingSession.capacity +
        (bestFreeForConcurrent.capacity - concurrentSession.capacity)

      candidates.push({
        concurrentSession,
        concurrentRoom: currentRoom,
        freeRoomForConcurrent: bestFreeForConcurrent,
        waste,
      })
    }
  }

  if (candidates.length > 0) {
    // Pick candidate with minimum waste
    candidates.sort((a, b) => a.waste - b.waste)
    const bestCandidate = candidates[0]!

    return {
      assignedClassroom: bestCandidate.concurrentRoom,
      innerReassignments: [
        {
          proposal: bestCandidate.concurrentSession,
          fromClassroomId:
            bestCandidate.concurrentSession.classroomId ??
            bestCandidate.concurrentSession.classroom?.id ??
            null,
          toClassroom: bestCandidate.freeRoomForConcurrent,
        },
      ],
    }
  }

  // Strategy 3: Multi-session permutation if 1-step swap is insufficient
  // If there are multiple concurrent sessions and multiple rooms, check if any
  // permutation of available rooms ([freeRooms, ...concurrentRooms]) satisfies all capacities:
  const allAvailableRooms = [
    ...freeRooms,
    ...concurrentSessions
      .map((s) =>
        candidateRooms.find((r) => r.id === (s.classroomId ?? s.classroom?.id))
      )
      .filter((r): r is ClassroomOption => Boolean(r)),
  ]

  // Remove duplicate room IDs if any
  const uniqueAvailableRoomsMap = new Map<string, ClassroomOption>()
  for (const r of allAvailableRooms) {
    uniqueAvailableRoomsMap.set(r.id, r)
  }
  const uniqueAvailableRooms = Array.from(uniqueAvailableRoomsMap.values())

  // If incoming session fits in any of the available rooms:
  const candidateRoomsForIncoming = uniqueAvailableRooms.filter(
    (r) => r.capacity >= incomingSession.capacity
  )

  for (const candidateRoom of candidateRoomsForIncoming) {
    // Remaining rooms for concurrent sessions:
    const remainingRooms = uniqueAvailableRooms.filter(
      (r) => r.id !== candidateRoom.id
    )
    // Check if concurrent sessions can all fit into remaining rooms
    const reassignments = findValidAssignmentForConcurrentSessions(
      concurrentSessions,
      remainingRooms
    )
    if (reassignments !== null) {
      return {
        assignedClassroom: candidateRoom,
        innerReassignments: reassignments,
      }
    }
  }

  // Strategy 4: Fallback - pick the largest available free room
  const fallbackRoom =
    [...freeRooms].sort((a, b) => b.capacity - a.capacity)[0] ?? null

  return { assignedClassroom: fallbackRoom, innerReassignments: [] }
}

function findValidAssignmentForConcurrentSessions(
  sessions: Proposal[],
  availableRooms: ClassroomOption[]
): InnerPeriodClassroomReassignment[] | null {
  if (sessions.length === 0) return []
  if (sessions.length > availableRooms.length) return null

  // Sort sessions largest to smallest
  const sortedSessions = [...sessions].sort((a, b) => b.capacity - a.capacity)
  const usedRoomIds = new Set<string>()
  const reassignments: InnerPeriodClassroomReassignment[] = []

  for (const session of sortedSessions) {
    const currentRoomId = session.classroomId ?? session.classroom?.id

    // Prefer keeping current room if it is available and fits
    if (
      currentRoomId &&
      !usedRoomIds.has(currentRoomId) &&
      availableRooms.some(
        (r) => r.id === currentRoomId && r.capacity >= session.capacity
      )
    ) {
      usedRoomIds.add(currentRoomId)
      continue
    }

    // Otherwise find smallest available room that fits
    const eligible = availableRooms
      .filter((r) => !usedRoomIds.has(r.id) && r.capacity >= session.capacity)
      .sort((a, b) => a.capacity - b.capacity)

    if (eligible.length === 0) return null

    const chosen = eligible[0]!
    usedRoomIds.add(chosen.id)

    if (chosen.id !== currentRoomId) {
      reassignments.push({
        proposal: session,
        fromClassroomId: currentRoomId ?? null,
        toClassroom: chosen,
      })
    }
  }

  return reassignments
}

/**
 * Plans the complete execution of a session swap between sourceProposal and targetProposal.
 * Sets masters to null for both swapped sessions (for supervisor manual assignment).
 * Automatically resolves and rebalances classrooms in both periods.
 */
export function planSessionSwap(
  sourceProposal: Proposal,
  targetProposal: Proposal,
  allProposals: Proposal[],
  classrooms: ClassroomOption[],
  occupiedSlots?: OccupiedClassroomSlot[]
): SessionSwapExecutionPlan {
  // Source session moves to target proposal's period
  const targetPeriod = {
    daysOfWeek: targetProposal.daysOfWeek,
    startTime: targetProposal.startTime,
    endTime: targetProposal.endTime,
  }
  const sourceResolution = resolvePeriodClassroomAssignment(
    sourceProposal,
    targetProposal.id,
    targetPeriod,
    allProposals,
    classrooms,
    occupiedSlots
  )

  // Target session moves to source proposal's period
  const sourcePeriod = {
    daysOfWeek: sourceProposal.daysOfWeek,
    startTime: sourceProposal.startTime,
    endTime: sourceProposal.endTime,
  }
  const targetResolution = resolvePeriodClassroomAssignment(
    targetProposal,
    sourceProposal.id,
    sourcePeriod,
    allProposals,
    classrooms,
    occupiedSlots
  )

  const allInnerReassignments = [
    ...sourceResolution.innerReassignments,
    ...targetResolution.innerReassignments,
  ]

  return {
    sourceProposalId: sourceProposal.id,
    sourceNewDays: targetProposal.daysOfWeek,
    sourceNewStartTime: targetProposal.startTime,
    sourceNewEndTime: targetProposal.endTime,
    sourceNewClassroom: sourceResolution.assignedClassroom,
    sourceNewTeacherId: null,

    targetProposalId: targetProposal.id,
    targetNewDays: sourceProposal.daysOfWeek,
    targetNewStartTime: sourceProposal.startTime,
    targetNewEndTime: sourceProposal.endTime,
    targetNewClassroom: targetResolution.assignedClassroom,
    targetNewTeacherId: null,

    innerReassignments: allInnerReassignments,
  }
}
