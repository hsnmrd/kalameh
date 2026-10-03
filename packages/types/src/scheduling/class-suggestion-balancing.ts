export function distributeClassCapacities(
  studentCount: number,
  classCount: number,
  capacityLimit: number
): number[] {
  if (
    !Number.isInteger(studentCount) ||
    studentCount < 0 ||
    !Number.isInteger(classCount) ||
    classCount < 0 ||
    !Number.isInteger(capacityLimit) ||
    capacityLimit < 1
  ) {
    throw new RangeError("class suggestion values are invalid")
  }

  if (classCount === 0) return []

  const targetCapacity = Math.max(
    classCount,
    Math.min(studentCount, classCount * capacityLimit)
  )
  const baseCapacity = Math.floor(targetCapacity / classCount)
  const remainder = targetCapacity % classCount

  return Array.from(
    { length: classCount },
    (_, index) => baseCapacity + (index < remainder ? 1 : 0)
  )
}

export function suggestBalancedClassCapacities(
  studentCount: number,
  capacityLimit: number
): number[] {
  if (studentCount === 0) return []
  return distributeClassCapacities(
    studentCount,
    Math.ceil(studentCount / capacityLimit),
    capacityLimit
  )
}

export function rebalanceClassCapacities(
  studentCount: number,
  capacities: number[],
  capacityLimit: number,
  fixedIndex?: number
): number[] {
  if (capacities.length === 0) return []

  const normalized = capacities.map((capacity) =>
    Math.min(capacityLimit, Math.max(1, Math.round(capacity)))
  )
  if (fixedIndex === undefined) {
    return distributeClassCapacities(
      studentCount,
      normalized.length,
      capacityLimit
    )
  }
  if (fixedIndex < 0 || fixedIndex >= normalized.length) {
    throw new RangeError("fixed class index is invalid")
  }

  const fixedCapacity = normalized[fixedIndex]!
  const otherCount = normalized.length - 1
  if (otherCount === 0) return [fixedCapacity]

  const remaining = distributeClassCapacities(
    Math.max(0, studentCount - fixedCapacity),
    otherCount,
    capacityLimit
  )
  let remainingIndex = 0
  return normalized.map((capacity, index) => {
    if (index === fixedIndex) return capacity
    const next = remaining[remainingIndex]
    remainingIndex += 1
    return next ?? 1
  })
}

export function calculateUncoveredStudents(
  studentCount: number,
  capacities: number[]
): number {
  return Math.max(
    0,
    studentCount - capacities.reduce((sum, capacity) => sum + capacity, 0)
  )
}
