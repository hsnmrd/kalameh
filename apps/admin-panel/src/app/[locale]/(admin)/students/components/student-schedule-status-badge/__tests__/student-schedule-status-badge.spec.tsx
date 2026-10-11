import { describe, it, expect } from "vitest"
import { render, screen } from "@/test/test-utils"
import { StudentScheduleStatusBadge } from "../index"

describe("StudentScheduleStatusBadge Component", () => {
  it("renders simple check icon with accessible title and aria-label when COMPLETE", () => {
    const { container } = render(
      <StudentScheduleStatusBadge scheduleStatus="COMPLETE" />
    )

    // Should NOT render visible text by default
    expect(screen.queryByText("برنامه مشخص شده")).not.toBeInTheDocument()

    // Check icon SVG should be rendered
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()

    // Accessible title & aria-label should be set on the wrapper span
    const iconWrapper = container.querySelector(
      '[aria-label="برنامه مشخص شده"]'
    )
    expect(iconWrapper).toBeInTheDocument()
    expect(iconWrapper).toHaveAttribute("title", "برنامه مشخص شده")
    expect(iconWrapper).toHaveClass("text-success")
  })

  it("renders simple clock icon with accessible title and aria-label when INCOMPLETE", () => {
    const { container } = render(
      <StudentScheduleStatusBadge scheduleStatus="INCOMPLETE" />
    )

    // Should NOT render visible text by default
    expect(screen.queryByText("نیاز به تماس")).not.toBeInTheDocument()

    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()

    const iconWrapper = container.querySelector('[aria-label="نیاز به تماس"]')
    expect(iconWrapper).toBeInTheDocument()
    expect(iconWrapper).toHaveAttribute("title", "نیاز به تماس")
    expect(iconWrapper).toHaveClass("text-muted-foreground")
  })

  it("renders dash when scheduleStatus is null or undefined", () => {
    render(<StudentScheduleStatusBadge scheduleStatus={null} />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("renders status label alongside icon when showLabel is true", () => {
    render(
      <StudentScheduleStatusBadge scheduleStatus="COMPLETE" showLabel={true} />
    )
    expect(screen.getByText("برنامه مشخص شده")).toBeInTheDocument()
  })
})
