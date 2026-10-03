import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

function getDeepKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.keys(obj).flatMap((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    const val = obj[key]
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return getDeepKeys(val as Record<string, unknown>, fullKey)
    }
    return [fullKey]
  })
}

describe("i18n message completeness & parity", () => {
  const faDir = path.resolve(__dirname, "../fa")
  const enDir = path.resolve(__dirname, "../en")
  const faFiles = fs.readdirSync(faDir).filter((f) => f.endsWith(".json"))
  const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith(".json"))

  it("should have matching message files in fa and en", () => {
    expect(faFiles.sort()).toEqual(enFiles.sort())
  })

  for (const file of faFiles) {
    it(`should have key parity between fa and en for ${file}`, () => {
      const faContent = JSON.parse(
        fs.readFileSync(path.join(faDir, file), "utf-8")
      )
      const enContent = JSON.parse(
        fs.readFileSync(path.join(enDir, file), "utf-8")
      )

      const faKeys = getDeepKeys(faContent).sort()
      const enKeys = getDeepKeys(enContent).sort()

      const missingInEn = faKeys.filter((k) => !enKeys.includes(k))
      const missingInFa = enKeys.filter((k) => !faKeys.includes(k))

      expect(
        missingInEn,
        `Keys present in fa/${file} but missing in en/${file}: ${missingInEn.join(", ")}`
      ).toEqual([])
      expect(
        missingInFa,
        `Keys present in en/${file} but missing in fa/${file}: ${missingInFa.join(", ")}`
      ).toEqual([])
    })
  }
})
