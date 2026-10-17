import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@/test/test-utils"
import { ReservationTimer } from "../index"
import enrollmentsMessagesFa from "@/messages/fa/enrollments.json"

describe("ReservationTimer Component", () => {
  const customMessages = {
    enrollments: enrollmentsMessagesFa,
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should render minutes on the left and seconds on the right in LTR direction", () => {
    // 24 minutes, 25 seconds = 24 * 60 + 25 = 1465 seconds
    render(<ReservationTimer initialSeconds={1465} />, {
      messages: customMessages,
    })

    const timerContainer = screen.getByText(":").parentElement
    expect(timerContainer).toBeInTheDocument()
    expect(timerContainer).toHaveAttribute("dir", "ltr")

    const spans = timerContainer?.querySelectorAll("span")
    expect(spans).toBeDefined()
    expect(spans?.length).toBe(3)

    // In LTR, child 0 is on the left (minutes), child 1 is :, child 2 is on the right (seconds)
    expect(spans?.[0].textContent).toBe("24")
    expect(spans?.[1].textContent).toBe(":")
    expect(spans?.[2].textContent).toBe("25")
  })

  it("should count down seconds correctly", () => {
    render(<ReservationTimer initialSeconds={1465} />, {
      messages: customMessages,
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const timerContainer = screen.getByText(":").parentElement
    const spans = timerContainer?.querySelectorAll("span")
    expect(spans?.[0].textContent).toBe("24")
    expect(spans?.[2].textContent).toBe("24")

    act(() => {
      vi.advanceTimersByTime(25000)
    })

    // 1465 - 26 = 1439 seconds -> 23 minutes, 59 seconds
    expect(spans?.[0].textContent).toBe("23")
    expect(spans?.[2].textContent).toBe("59")
  })

  it("should call onExpire when timer reaches 0 or if initialSeconds is 0", () => {
    const onExpire = vi.fn()
    render(<ReservationTimer initialSeconds={0} onExpire={onExpire} />, {
      messages: customMessages,
    })

    expect(
      screen.getByText(enrollmentsMessagesFa.timer.expired)
    ).toBeInTheDocument()
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it("should trigger onExpire when ticking down to zero", () => {
    const onExpire = vi.fn()
    render(<ReservationTimer initialSeconds={2} onExpire={onExpire} />, {
      messages: customMessages,
    })

    expect(onExpire).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(onExpire).toHaveBeenCalled()
  })
})
