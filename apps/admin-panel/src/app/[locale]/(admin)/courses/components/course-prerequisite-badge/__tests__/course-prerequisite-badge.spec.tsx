import { describe, it, expect } from "vitest"
import { render, screen } from "../../../../../../../test/test-utils"
import { CoursePrerequisiteBadge } from "../index"

describe("CoursePrerequisiteBadge Component", () => {
  it("should render base level badge with Layers icon and 'سطح پایه' when no prerequisite", () => {
    const { container } = render(
      <CoursePrerequisiteBadge prerequisite={null} />
    )

    expect(screen.getByText("سطح پایه")).toBeInTheDocument()
    // Does not render without prerequisite
    expect(screen.queryByText(/بدون پیش‌نیاز/i)).not.toBeInTheDocument()

    // Has SVG icon
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  it("should render prerequisite badge with shortened title and GitCommit icon", () => {
    const { container } = render(
      <CoursePrerequisiteBadge
        prerequisite={{
          id: "prereq-1",
          title: "American English File 1 - 1",
        }}
      />
    )

    // Should display shortened form AEF 1-1
    expect(screen.getByText("AEF 1-1")).toBeInTheDocument()

    // Badge should retain full title as title attribute
    const badge = container.querySelector(
      "[title='American English File 1 - 1']"
    )
    expect(badge).toBeInTheDocument()
  })
})
