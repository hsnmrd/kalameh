import { describe, it, expect } from "vitest"
import {
  gregorianToJalali,
  jalaliToGregorian,
  formatJalali,
  isJalaliHoliday,
  getJalaliHolidaysForYear,
  getJalaliHolidaysInRange,
} from "../src/calendar/jalali-holidays.js"

describe("Jalali Calendar & Holidays Engine", () => {
  it("accurately converts dates between Gregorian and Jalali", () => {
    // 1403 Farvardin 1 is 2024-03-20
    const gDate = jalaliToGregorian(1403, 1, 1)
    expect(gDate.getFullYear()).toBe(2024)
    expect(gDate.getMonth()).toBe(2) // 0-indexed -> March
    expect(gDate.getDate()).toBe(20)

    const jDate = gregorianToJalali(gDate)
    expect(jDate.year).toBe(1403)
    expect(jDate.month).toBe(1)
    expect(jDate.day).toBe(1)
  })

  it("identifies fixed solar holidays across any year", () => {
    // Nowruz 1 Farvardin
    const h1 = isJalaliHoliday("1403/01/01")
    expect(h1.isHoliday).toBe(true)
    expect(h1.holiday?.titleFa).toContain("عید نوروز")

    // 13 Farvardin (Sizdah Bedar)
    const h13 = isJalaliHoliday("1404/01/13")
    expect(h13.isHoliday).toBe(true)
    expect(h13.holiday?.titleFa).toContain("روز طبیعت")

    // 22 Bahman
    const hBahman = isJalaliHoliday("1403/11/22")
    expect(hBahman.isHoliday).toBe(true)
    expect(hBahman.holiday?.titleFa).toContain("پیروزی انقلاب اسلامی")

    // Normal working day (e.g. 15 Mehr)
    const normalDay = isJalaliHoliday("1403/07/15")
    expect(normalDay.isHoliday).toBe(false)
  })

  it("identifies variable lunar holidays for specific year 1403", () => {
    // 1403/06/04 is Arbaeen
    const arbaeen = isJalaliHoliday("1403/06/04")
    expect(arbaeen.isHoliday).toBe(true)
    expect(arbaeen.holiday?.titleFa).toContain("اربعین")

    // 1403/06/14 is Martyrdom of Imam Reza
    const reza = isJalaliHoliday("1403/06/14")
    expect(reza.isHoliday).toBe(true)
    expect(reza.holiday?.titleFa).toContain("امام رضا")
  })

  it("returns holidays within a date range", () => {
    // Shahrivar 1403 has multiple holidays
    const holidays = getJalaliHolidaysInRange("1403/06/01", "1403/06/31")
    expect(holidays.length).toBeGreaterThanOrEqual(4)
    const titles = holidays.map((h) => h.titleFa).join(" ")
    expect(titles).toContain("اربعین")
    expect(titles).toContain("امام رضا")
  })

  it("provides complete holiday list for a given year", () => {
    const list = getJalaliHolidaysForYear(1403)
    expect(list.length).toBeGreaterThanOrEqual(20)
  })
})
