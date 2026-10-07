import { describe, expect, it, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import CalendarPage from "../page"

vi.mock("../components/calendar-content", () => ({
  CalendarContent: () => <div data-testid="calendar-content" />,
}))

describe("CalendarPage", () => {
  it("renders the institute calendar page", () => {
    render(<CalendarPage />)

    expect(screen.getByTestId("calendar-content")).toBeInTheDocument()
  })
})
