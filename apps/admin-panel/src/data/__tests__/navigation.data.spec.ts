import { describe, expect, it } from "vitest"
import {
  ACADEMIC_NAV_ITEMS,
  ADMINISTRATION_NAV_ITEMS,
  FINANCE_NAV_ITEMS,
  PEOPLE_NAV_ITEMS,
} from "../navigation.data"

describe("admin navigation groups", () => {
  it("groups related destinations and exposes off-days as its own route", () => {
    expect(ACADEMIC_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "offDays", href: "/off-days" }),
      ])
    )
    expect(PEOPLE_NAV_ITEMS.map((item) => item.key)).toEqual([
      "teachers",
      "students",
    ])
    expect(FINANCE_NAV_ITEMS.map((item) => item.key)).toEqual(["finance"])
    expect(ADMINISTRATION_NAV_ITEMS.map((item) => item.key)).toEqual([
      "staff",
      "rolePermissions",
    ])
  })
})
