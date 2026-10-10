import { describe, it, expect } from "vitest"
import { render, screen } from "@/test/test-utils"
import { StudentScheduleStatusBadge } from "../index"

describe("StudentScheduleStatusBadge Component", () => {
  it("renders checkmark icon and hides 'برنامه مشخص شده' on mobile size (hidden sm:inline) when COMPLETE", () => {
    const { container } = render(
      <StudentScheduleStatusBadge scheduleStatus="COMPLETE" />
    )

    // The text should have hidden sm:inline to hide on mobile size
    const textSpan = screen.getByText("برنامه مشخص شده")
    expect(textSpan).toBeInTheDocument()
    expect(textSpan).toHaveClass("hidden")
    expect(textSpan).toHaveClass("sm:inline")

    // Check icon SVG should be rendered
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()

    // Accessible title & aria-label should be set
    const badge = container.querySelector('[aria-label="برنامه مشخص شده"]')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute("title", "برنامه مشخص شده")
  })

  it("renders clock icon and status text when INCOMPLETE", () => {
    const { container } = render(
      <StudentScheduleStatusBadge scheduleStatus="INCOMPLETE" />
    )

    const textSpan = screen.getByText("نیاز به تماس")
    expect(textSpan).toBeInTheDocument()
    // Should NOT have hidden sm:inline
    expect(textSpan).not.toHaveClass("hidden")

    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()

    const badge = container.querySelector('[aria-label="نیاز به تماس"]')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute("title", "نیاز به تماس")
  })
})
