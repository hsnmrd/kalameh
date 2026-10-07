import { describe, expect, it } from "vitest"
import {
  ACADEMIC_CYCLE_NAV_ITEMS,
  PEOPLE_NAV_ITEMS,
  FACILITIES_NAV_ITEMS,
  FINANCE_NAV_ITEMS,
  ADMINISTRATION_NAV_ITEMS,
  ACADEMIC_NAV_ITEMS,
  INSTITUTE_NAV_ITEMS,
  PLATFORM_DASHBOARD_NAV_ITEM,
  INSTITUTE_DASHBOARD_NAV_ITEM,
  SUPER_ADMIN_PLATFORM_NAV,
} from "../navigation.data"

describe("admin navigation groups", () => {
  it("structures academic lifecycle according to system onboarding needs", () => {
    expect(ACADEMIC_CYCLE_NAV_ITEMS.map((item) => item.key)).toEqual([
      "operatingPhases",
      "offDays",
      "terms",
      "classes",
    ])
    expect(
      ACADEMIC_CYCLE_NAV_ITEMS.find((item) => item.key === "scheduling")
    ).toBeUndefined()
  })

  it("structures people with students first, then teachers", () => {
    expect(PEOPLE_NAV_ITEMS.map((item) => item.key)).toEqual([
      "students",
      "teachers",
    ])
  })

  it("structures base catalog and facilities", () => {
    expect(FACILITIES_NAV_ITEMS.map((item) => item.key)).toEqual([
      "courses",
      "classrooms",
      "branches",
    ])
  })

  it("preserves finance and administration groups", () => {
    expect(FINANCE_NAV_ITEMS.map((item) => item.key)).toEqual(["finance"])
    expect(ADMINISTRATION_NAV_ITEMS.map((item) => item.key)).toEqual([
      "staff",
      "rolePermissions",
    ])
  })

  it("maintains backwards-compatible aggregates", () => {
    expect(ACADEMIC_NAV_ITEMS).toEqual([
      ...ACADEMIC_CYCLE_NAV_ITEMS,
      ...FACILITIES_NAV_ITEMS,
    ])
    expect(INSTITUTE_NAV_ITEMS).toEqual([
      ...ACADEMIC_CYCLE_NAV_ITEMS,
      ...PEOPLE_NAV_ITEMS,
      ...FACILITIES_NAV_ITEMS,
      ...FINANCE_NAV_ITEMS,
      ...ADMINISTRATION_NAV_ITEMS,
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
