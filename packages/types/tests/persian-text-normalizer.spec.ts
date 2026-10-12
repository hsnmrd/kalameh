import { describe, it, expect } from "vitest"
import {
  normalizeDigits,
  normalizePersianText,
  cleanPersianText,
  isPersianTextEqual,
} from "../src/excel/persian-text-normalizer.js"

describe("persian-text-normalizer", () => {
  describe("normalizeDigits", () => {
    it("converts Persian and Arabic digits to ASCII digits", () => {
      expect(normalizeDigits("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789")
      expect(normalizeDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789")
      expect(normalizeDigits("09121111111")).toBe("09121111111")
    })

    it("handles empty or null string gracefully", () => {
      expect(normalizeDigits("")).toBe("")
      expect(normalizeDigits(null)).toBe("")
      expect(normalizeDigits(undefined)).toBe("")
    })
  })

  describe("normalizePersianText", () => {
    it("normalizes Arabic Yeh and Kaf to Persian equivalents", () => {
      expect(normalizePersianText("انگليسي مقدماتي")).toBe("انگلیسی مقدماتی")
      expect(normalizePersianText("مدرّس")).toBe("مدرس") // strips Tashkeel
      expect(normalizePersianText("شعبه مركزي")).toBe("شعبه مرکزی")
    })

    it("normalizes half-space (ZWNJ) and underscores into spaces", () => {
      expect(normalizePersianText("دانش‌آموز")).toBe("دانش اموز")
      expect(normalizePersianText("نام_خانوادگی")).toBe("نام خانوادگی")
      expect(normalizePersianText("پیش‌نیاز")).toBe("پیش نیاز")
    })

    it("lowercases mixed Latin characters and trims spaces", () => {
      expect(normalizePersianText("  IELTS Pre-Course  ")).toBe(
        "ielts pre course"
      )
      expect(normalizePersianText("Top Notch 1A")).toBe("top notch 1a")
    })
  })

  describe("cleanPersianText", () => {
    it("cleans Arabic characters to Persian without removing words", () => {
      expect(cleanPersianText("علي محمّدي")).toBe("علی محمدی")
      expect(cleanPersianText("فاطمة")).toBe("فاطمه")
    })
  })

  describe("isPersianTextEqual", () => {
    it("returns true for matching variations of the same Persian word", () => {
      expect(isPersianTextEqual("دانش‌آموز", "دانش آموز")).toBe(true)
      expect(isPersianTextEqual("دانش‌آموز", "دانشاموز")).toBe(true)
      expect(isPersianTextEqual("شعبه مرکزی", "شعبه مركزي")).toBe(true)
      expect(isPersianTextEqual("پیش‌نیاز", "پیشنیاز")).toBe(true)
      expect(
        isPersianTextEqual("انگلیسی مقدماتی A1", "انگليسي مقدماتي a1")
      ).toBe(true)
      expect(isPersianTextEqual("کد ملی", "كدملی")).toBe(true)
    })

    it("returns false for different words", () => {
      expect(isPersianTextEqual("شعبه غرب", "شعبه شرق")).toBe(false)
      expect(isPersianTextEqual("انگلیسی A1", "انگلیسی A2")).toBe(false)
    })
  })
})
