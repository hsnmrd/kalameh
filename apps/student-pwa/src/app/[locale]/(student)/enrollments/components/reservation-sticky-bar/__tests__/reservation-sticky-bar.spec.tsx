import { describe, it, expect } from "vitest"
import { render, screen } from "@/test/test-utils"
import { ReservationStickyBar } from "../index"
import enrollmentsMessagesFa from "@/messages/fa/enrollments.json"

describe("ReservationStickyBar Component", () => {
  const customMessages = {
    enrollments: enrollmentsMessagesFa,
  }

  it("should render timer and price across from each other when visible", () => {
    render(
      <ReservationStickyBar
        minutes={29}
        seconds={34}
        tuition={1500000}
        visible={true}
      />,
      {
        messages: customMessages,
      }
    )

    const bar = screen.getByTestId("reservation-sticky-bar")
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute("aria-hidden", "false")
    expect(bar.className).toContain("translate-y-0")

    // Timer label & formatted time
    expect(
      screen.getByText(enrollmentsMessagesFa.timer.stickyTimerLabel)
    ).toBeInTheDocument()
    expect(screen.getByText("29:34")).toBeInTheDocument()

    // Tuition label & amount
    expect(
      screen.getByText(enrollmentsMessagesFa.timer.stickyTuitionLabel + ":")
    ).toBeInTheDocument()
    expect(screen.getByText("1,500,000")).toBeInTheDocument()
    expect(screen.getByText("تومان")).toBeInTheDocument()
  })

  it("should hide with negative translate when visible is false", () => {
    render(
      <ReservationStickyBar
        minutes={10}
        seconds={0}
        tuition={2000000}
        visible={false}
      />,
      {
        messages: customMessages,
      }
    )

    const bar = screen.getByTestId("reservation-sticky-bar")
    expect(bar).toHaveAttribute("aria-hidden", "true")
    expect(bar.className).toContain("-translate-y-full")
  })

  it("should apply urgent styling when isUrgent is true", () => {
    render(
      <ReservationStickyBar
        minutes={3}
        seconds={45}
        isUrgent={true}
        tuition={800000}
        visible={true}
      />,
      {
        messages: customMessages,
      }
    )

    const timeDisplay = screen.getByText("03:45")
    expect(timeDisplay.className).toContain("text-destructive")
  })
})
