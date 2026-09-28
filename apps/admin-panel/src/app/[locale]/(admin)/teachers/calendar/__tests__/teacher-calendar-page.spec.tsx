import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/test-utils"
import TeacherCalendarPage from "../page"

vi.mock("../components/teacher-calendar-content", () => ({
  TeacherCalendarContent: () => <div data-testid="teacher-calendar-content" />,
}))

describe("TeacherCalendarPage", () => {
  it("renders teacher calendar content guarded by modules and permissions", () => {
    render(<TeacherCalendarPage />)
    expect(screen.getByTestId("teacher-calendar-content")).toBeInTheDocument()
  })
})
