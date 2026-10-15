import { describe, it, expect } from "vitest"
import { formatCourseShortTitle } from "@workspace/ui/lib/utils"

describe("formatCourseShortTitle", () => {
  it("should return empty string for null or undefined or empty input", () => {
    expect(formatCourseShortTitle(null)).toBe("")
    expect(formatCourseShortTitle(undefined)).toBe("")
    expect(formatCourseShortTitle("")).toBe("")
    expect(formatCourseShortTitle("   ")).toBe("")
  })

  it("should format American English File titles to AEF with volume and term index", () => {
    expect(formatCourseShortTitle("American English File 3 - 5")).toBe(
      "AEF 3-5"
    )
    expect(formatCourseShortTitle("American English File 1 - 2")).toBe(
      "AEF 1-2"
    )
    expect(formatCourseShortTitle("American English File 1 - 1")).toBe(
      "AEF 1-1"
    )
    expect(formatCourseShortTitle("American English File Starter - 1")).toBe(
      "AEF Starter-1"
    )
    expect(formatCourseShortTitle("American English File 3")).toBe("AEF 3")
  })

  it("should handle Persian and Arabic numerals correctly", () => {
    expect(formatCourseShortTitle("American English File ۳ - ۵")).toBe(
      "AEF 3-5"
    )
    expect(formatCourseShortTitle("American English File ۱ - ۱")).toBe(
      "AEF 1-1"
    )
    expect(formatCourseShortTitle("American English File ۱ - ۲")).toBe(
      "AEF 1-2"
    )
    expect(formatCourseShortTitle("امریکن اینگلیش فایل ۳ - ۵")).toBe("AEF 3-5")
    expect(formatCourseShortTitle("امریکن انگلیش فایل ۱ - ۱")).toBe("AEF 1-1")
  })

  it("should format other popular series into their standard acronyms", () => {
    expect(formatCourseShortTitle("Top Notch 1A - 2")).toBe("TN 1A-2")
    expect(formatCourseShortTitle("Top Notch Fundamentals A - 1")).toBe(
      "TN Fundamentals A-1"
    )
    expect(formatCourseShortTitle("Family and Friends 2 - 3")).toBe("FF 2-3")
    expect(formatCourseShortTitle("First Friends 1 - 1")).toBe("FF 1-1")
    expect(formatCourseShortTitle("Touchstone 3 - 4")).toBe("TS 3-4")
    expect(formatCourseShortTitle("Four Corners 2 - 1")).toBe("FC 2-1")
    expect(formatCourseShortTitle("Let's Go 1 - 2")).toBe("LG 1-2")
    expect(formatCourseShortTitle("Interchange 2 - 3")).toBe("IC 2-3")
    expect(formatCourseShortTitle("Oxford Phonics World 1 - 2")).toBe("OPW 1-2")
  })

  it("should handle Term, Part, and Persian suffix labels cleanly", () => {
    expect(formatCourseShortTitle("American English File 3 - Term 5")).toBe(
      "AEF 3-5"
    )
    expect(formatCourseShortTitle("American English File 3 - Part 5")).toBe(
      "AEF 3-5"
    )
    expect(formatCourseShortTitle("American English File 3 - ترم 5")).toBe(
      "AEF 3-5"
    )
    expect(formatCourseShortTitle("American English File 3 - پارت 5")).toBe(
      "AEF 3-5"
    )
  })

  it("should handle multi-word titles by generating acronyms from first letters", () => {
    expect(formatCourseShortTitle("General English Conversation 2 - 1")).toBe(
      "GEC 2-1"
    )
  })

  it("should preserve short titles that do not need abbreviation", () => {
    expect(formatCourseShortTitle("Starter 101")).toBe("Starter 101")
    expect(formatCourseShortTitle("A1")).toBe("A1")
    expect(formatCourseShortTitle("IELTS")).toBe("IELTS")
  })
})
