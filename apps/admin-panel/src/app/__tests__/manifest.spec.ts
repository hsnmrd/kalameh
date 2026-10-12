import { describe, it, expect } from "vitest"
import manifest from "../manifest"

describe("PWA Manifest", () => {
  it("generates a valid Next.js App Router Web App Manifest", () => {
    const config = manifest()

    expect(config.name).toBe("سامانه مدیریت کلمه | Kalameh Admin")
    expect(config.short_name).toBe("Kalameh Admin")
    expect(config.display).toBe("standalone")
    expect(config.start_url).toBe("/")
    expect(config.theme_color).toBe("#0f172a")
    expect(config.background_color).toBe("#0f172a")
    expect(config.icons).toBeDefined()
    expect(config.icons?.length).toBeGreaterThanOrEqual(4)

    const sizes = config.icons?.map((icon) => icon.sizes)
    expect(sizes).toContain("192x192")
    expect(sizes).toContain("512x512")
    expect(sizes).toContain("180x180")

    const maskableIcon = config.icons?.find(
      (icon) => icon.purpose === "maskable"
    )
    expect(maskableIcon).toBeDefined()
  })
})
