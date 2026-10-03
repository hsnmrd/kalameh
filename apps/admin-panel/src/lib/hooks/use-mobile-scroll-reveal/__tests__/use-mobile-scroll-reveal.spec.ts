import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useMobileScrollReveal } from "../index"

describe("useMobileScrollReveal", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", { value: 0, writable: true })
    Object.defineProperty(document.documentElement, "scrollTop", {
      value: 0,
      writable: true,
    })
  })

  it("should initialize as not revealed on mobile by default", () => {
    const { result } = renderHook(() => useMobileScrollReveal())
    expect(result.current.isRevealed).toBe(false)
  })

  it("should remain revealed when pinned option is true", () => {
    const { result } = renderHook(() => useMobileScrollReveal({ pinned: true }))
    expect(result.current.isRevealed).toBe(true)
  })

  it("should toggle reveal state manually", () => {
    const { result } = renderHook(() => useMobileScrollReveal())
    expect(result.current.isRevealed).toBe(false)

    act(() => {
      result.current.toggleRevealed()
    })
    expect(result.current.isRevealed).toBe(true)

    act(() => {
      result.current.toggleRevealed()
    })
    expect(result.current.isRevealed).toBe(false)
  })

  it("should reveal on downward touch swipe when at top of page", () => {
    const { result } = renderHook(() => useMobileScrollReveal())
    expect(result.current.isRevealed).toBe(false)

    act(() => {
      window.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [{ clientY: 50 } as unknown as Touch],
        })
      )
      window.dispatchEvent(
        new TouchEvent("touchmove", {
          touches: [{ clientY: 100 } as unknown as Touch], // +50px swipe down
        })
      )
    })

    expect(result.current.isRevealed).toBe(true)
  })

  it("should reveal on tiny scroll from top of page", () => {
    const { result } = renderHook(() => useMobileScrollReveal())
    expect(result.current.isRevealed).toBe(false)

    act(() => {
      Object.defineProperty(window, "scrollY", { value: 15, writable: true })
      window.dispatchEvent(new Event("scroll"))
    })

    expect(result.current.isRevealed).toBe(true)
  })
})
