import { describe, expect, it } from "vitest"
import {
  ACADEMIC_NAV_ITEMS,
  ADMINISTRATION_NAV_ITEMS,
  FINANCE_NAV_ITEMS,
  PEOPLE_NAV_ITEMS,
  PLATFORM_DASHBOARD_NAV_ITEM,
  INSTITUTE_DASHBOARD_NAV_ITEM,
  SUPER_ADMIN_PLATFORM_NAV,
} from "../navigation.data"

describe("admin navigation groups", () => {
  it("groups related destinations and exposes off-days as its own route", () => {
    expect(ACADEMIC_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "offDays", href: "/off-days" }),
      ])
    )
    expect(
      ACADEMIC_NAV_ITEMS.find((item) => item.key === "scheduling")
    ).toBeUndefined()
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

  it("exposes distinct platform dashboard and institute dashboard items", () => {
    expect(PLATFORM_DASHBOARD_NAV_ITEM).toEqual(
      expect.objectContaining({
        key: "platformDashboard",
        href: "/",
      })
    )
    expect(INSTITUTE_DASHBOARD_NAV_ITEM).toEqual(
      expect.objectContaining({
        key: "instituteDashboard",
        href: "/overview",
      })
    )
    expect(SUPER_ADMIN_PLATFORM_NAV.map((item) => item.key)).toEqual([
      "platformDashboard",
      "institutes",
    ])
  })
})
