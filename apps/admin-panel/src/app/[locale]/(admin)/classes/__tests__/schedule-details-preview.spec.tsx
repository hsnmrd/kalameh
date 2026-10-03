import { describe, it, expect } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { ScheduleDetailsPreview } from "../components/schedule-details-preview"

describe("ScheduleDetailsPreview Component", () => {
  it("should render null when no schedule data is provided", () => {
    const { container } = render(
      <ScheduleDetailsPreview
        daysOfWeek={[]}
        sessionDates={[]}
        startTime={null}
        endTime={null}
        schedule={null}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("should render schedule details header and weekday badges when provided", () => {
    render(
      <ScheduleDetailsPreview
        daysOfWeek={["SATURDAY", "MONDAY", "WEDNESDAY"]}
        sessionDates={["2026-10-01", "2026-10-03", "2026-10-05"]}
        startTime="17:00"
        endTime="18:30"
        schedule="شنبه، دوشنبه، چهارشنبه (17:00 - 18:30)"
      />
    )

    expect(screen.getByText(/جزئیات زمان‌بندی و جلسات/i)).toBeInTheDocument()
    expect(screen.getByText(/^شنبه$/i)).toBeInTheDocument()
    expect(screen.getByText(/^دوشنبه$/i)).toBeInTheDocument()
    expect(screen.getByText(/^چهارشنبه$/i)).toBeInTheDocument()
    expect(screen.getByText(/3 جلسه در ترم/i)).toBeInTheDocument()
    expect(screen.getByText(/ساعت 17:00 تا 18:30/i)).toBeInTheDocument()
  })
})
