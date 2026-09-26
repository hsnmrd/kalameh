import { describe, expect, it } from "vitest"
import {
  calculateUncoveredStudents,
  rebalanceClassCapacities,
  suggestBalancedClassCapacities,
} from "@workspace/types"

describe("class suggestion balancing", () => {
  it("balances 29 students across a capacity limit of 20", () => {
    expect(suggestBalancedClassCapacities(29, 20)).toEqual([15, 14])
  })

  it("keeps an edited class fixed and rebalances its siblings", () => {
    expect(rebalanceClassCapacities(29, [15, 14, 1], 20, 0)).toEqual([15, 7, 7])
  })

  it("does not recreate a removed final class and reports the shortfall", () => {
    expect(rebalanceClassCapacities(29, [], 20)).toEqual([])
    expect(calculateUncoveredStudents(29, [])).toBe(29)
  })
})
