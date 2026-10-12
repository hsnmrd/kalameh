import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { usePwa, type BeforeInstallPromptEvent } from "../index"

describe("usePwa hook", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("initializes with default status in browser environment", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => usePwa())

    expect(result.current.isInstalled).toBe(false)
    expect(result.current.isInstallable).toBe(false)
    expect(result.current.isUpdateAvailable).toBe(false)
  })

  it("handles online and offline window events", () => {
    const { result } = renderHook(() => usePwa())

    act(() => {
      window.dispatchEvent(new Event("offline"))
    })
    expect(result.current.isOffline).toBe(true)

    act(() => {
      window.dispatchEvent(new Event("online"))
    })
    expect(result.current.isOffline).toBe(false)
  })

  it("captures beforeinstallprompt event and exposes installApp", async () => {
    const { result } = renderHook(() => usePwa())

    const mockPrompt = vi.fn().mockResolvedValue(undefined)
    const promptEvent = new Event(
      "beforeinstallprompt"
    ) as unknown as BeforeInstallPromptEvent & {
      prompt: typeof mockPrompt
      userChoice: Promise<{ outcome: "accepted"; platform: "web" }>
    }
    promptEvent.prompt = mockPrompt
    promptEvent.userChoice = Promise.resolve({
      outcome: "accepted",
      platform: "web",
    })

    act(() => {
      window.dispatchEvent(promptEvent)
    })

    expect(result.current.isInstallable).toBe(true)

    let installResult = false
    await act(async () => {
      installResult = await result.current.installApp()
    })

    expect(mockPrompt).toHaveBeenCalledTimes(1)
    expect(installResult).toBe(true)
    expect(result.current.isInstallable).toBe(false)
  })

  it("handles appinstalled event", () => {
    const { result } = renderHook(() => usePwa())

    act(() => {
      window.dispatchEvent(new Event("appinstalled"))
    })

    expect(result.current.isInstallable).toBe(false)
  })
})
