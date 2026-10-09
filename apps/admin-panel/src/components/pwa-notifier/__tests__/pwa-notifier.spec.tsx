import { describe, it, expect, vi } from "vitest"
import { render } from "@/test/test-utils"
import { toast } from "@workspace/ui/components/sonner"
import * as pwaProvider from "@/components/pwa-provider"
import { PwaNotifier } from "../index"

describe("PwaNotifier", () => {
  it("renders without crashing", () => {
    vi.spyOn(pwaProvider, "usePwaContext").mockReturnValue({
      isSupported: true,
      isInstalled: false,
      isInstallable: false,
      isOffline: false,
      isUpdateAvailable: false,
      installApp: vi.fn(),
      updateApp: vi.fn(),
    })

    const { container } = render(<PwaNotifier />)
    expect(container).toBeEmptyDOMElement()
  })

  it("notifies when update is available", () => {
    const updateAppMock = vi.fn()
    const toastInfoSpy = vi
      .spyOn(toast, "info")
      .mockReturnValue("test-id" as unknown as string)

    vi.spyOn(pwaProvider, "usePwaContext").mockReturnValue({
      isSupported: true,
      isInstalled: false,
      isInstallable: false,
      isOffline: false,
      isUpdateAvailable: true,
      installApp: vi.fn(),
      updateApp: updateAppMock,
    })

    render(<PwaNotifier />)

    expect(toastInfoSpy).toHaveBeenCalledWith(
      "نسخه جدید در دسترس است",
      expect.objectContaining({
        description: "نسخه جدیدی از پنل مدیریت آماده بارگذاری است.",
      })
    )
  })
})
