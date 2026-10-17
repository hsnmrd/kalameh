import { describe, expect, it } from "vitest"
import { hasInstituteFinanceInfo } from "../src"

describe("hasInstituteFinanceInfo", () => {
  it("returns false for null or undefined institute", () => {
    expect(hasInstituteFinanceInfo(null)).toBe(false)
    expect(hasInstituteFinanceInfo(undefined)).toBe(false)
  })

  it("returns false when all banking fields are null, undefined, or empty", () => {
    expect(
      hasInstituteFinanceInfo({
        bankCardNumber: null,
        bankAccountName: null,
        bankShaba: null,
      })
    ).toBe(false)

    expect(
      hasInstituteFinanceInfo({
        bankCardNumber: "",
        bankAccountName: "   ",
        bankShaba: "",
      })
    ).toBe(false)

    expect(hasInstituteFinanceInfo({})).toBe(false)
  })

  it("returns true when bankCardNumber is provided", () => {
    expect(
      hasInstituteFinanceInfo({
        bankCardNumber: "6037991812345678",
      })
    ).toBe(true)
  })

  it("returns true when bankAccountName is provided", () => {
    expect(
      hasInstituteFinanceInfo({
        bankAccountName: "آموزشگاه زبان کلمه",
      })
    ).toBe(true)
  })

  it("returns true when bankShaba is provided", () => {
    expect(
      hasInstituteFinanceInfo({
        bankShaba: "IR120170000000123456789012",
      })
    ).toBe(true)
  })

  it("returns true when all fields are provided", () => {
    expect(
      hasInstituteFinanceInfo({
        bankCardNumber: "6037991812345678",
        bankAccountName: "حساب مرکزی",
        bankShaba: "IR120170000000123456789012",
      })
    ).toBe(true)
  })
})
