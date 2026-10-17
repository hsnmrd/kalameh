import { describe, expect, it } from "vitest"
import { hasInstituteFinanceInfo, isInstituteFinanceComplete } from "../src"

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

  it("returns false when banking fields contain literal 'null' or 'undefined' strings", () => {
    expect(
      hasInstituteFinanceInfo({
        bankCardNumber: "null",
        bankAccountName: "null",
        bankShaba: "null",
      })
    ).toBe(false)

    expect(
      hasInstituteFinanceInfo({
        bankCardNumber: "undefined",
        bankAccountName: "undefined",
        bankShaba: "undefined",
      })
    ).toBe(false)
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

describe("isInstituteFinanceComplete", () => {
  it("returns false if any field is missing, invalid, or null", () => {
    expect(isInstituteFinanceComplete(null)).toBe(false)
    expect(
      isInstituteFinanceComplete({
        bankCardNumber: "6037991812345678",
        bankAccountName: "آموزشگاه زبان کلمه",
        bankShaba: null,
      })
    ).toBe(false)
    expect(
      isInstituteFinanceComplete({
        bankCardNumber: "123", // invalid length
        bankAccountName: "آموزشگاه زبان کلمه",
        bankShaba: "IR120170000000123456789012",
      })
    ).toBe(false)
    expect(
      isInstituteFinanceComplete({
        bankCardNumber: "null",
        bankAccountName: "null",
        bankShaba: "null",
      })
    ).toBe(false)
  })

  it("returns true when all fields are valid", () => {
    expect(
      isInstituteFinanceComplete({
        bankCardNumber: "6037991812345678",
        bankAccountName: "آموزشگاه زبان کلمه",
        bankShaba: "IR120170000000123456789012",
      })
    ).toBe(true)
  })
})
