import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "../../../../../test/test-utils"
import type { CourseDemandSummaryDto } from "@workspace/types"
import { DemandBreakdownDrawer } from "../components/scheduling-demand-view/demand-breakdown-drawer"

const mockCourses: CourseDemandSummaryDto[] = [
  {
    courseId: "course-1",
    courseTitle: "American English File 2",
    baseFee: 1200000,
    prerequisiteId: "course-prereq",
    prerequisiteTitle: "American English File 1",
    eligibleStudentsCount: 15,
    passedPrerequisiteCount: 10,
    continuingStudentsCount: 10,
    newPlacementCount: 5,
    morningShiftCount: 5,
    afternoonShiftCount: 5,
    flexibleShiftCount: 5,
    evenDaysPreferenceCount: 10,
    oddDaysPreferenceCount: 5,
    anyDayPreferenceCount: 0,
    suggestedClassCount: 2,
    suggestedCapacity: 14,
    suggestedInPersonCount: 2,
    suggestedOnlineCount: 0,
  },
]

describe("DemandBreakdownDrawer", () => {
  it("is closed by default and does not render table rows", () => {
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        adjustments={{}}
        onAdjustmentChange={vi.fn()}
      />
    )

    // The toggle button is present
    expect(
      screen.getByText(/مشاهده و ویرایش جزئیات دوره‌ها/)
    ).toBeInTheDocument()

    // Since it's closed by default, the course title is not visible
    expect(
      screen.queryByText("American English File 2")
    ).not.toBeInTheDocument()
  })

  it("expands on click and displays breakdown with continuing and new placements", () => {
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        adjustments={{}}
        onAdjustmentChange={vi.fn()}
      />
    )

    const toggle = screen.getByText(/مشاهده و ویرایش جزئیات دوره‌ها/)
    fireEvent.click(toggle)

    expect(screen.getByText("American English File 2")).toBeInTheDocument()
    expect(
      screen.getByText(/۱۰ در حال تحصیل \+ ۵ تعیین‌سطح = ۱۵ نفر/)
    ).toBeInTheDocument()
  })

  it("calls onAdjustmentChange when modifying suggested classes and capacity", () => {
    const onAdjustmentChange = vi.fn()
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        adjustments={{}}
        onAdjustmentChange={onAdjustmentChange}
      />
    )

    const toggle = screen.getByText(/مشاهده و ویرایش جزئیات دوره‌ها/)
    fireEvent.click(toggle)

    const classInput = screen.getByLabelText(
      /تعداد کلاس پیشنهادی - American English File 2/
    )
    fireEvent.change(classInput, { target: { value: "3" } })
    expect(onAdjustmentChange).toHaveBeenCalledWith("course-1", {
      suggestedClassCount: 3,
    })

    const capacityInput = screen.getByLabelText(
      /ظرفیت هر کلاس - American English File 2/
    )
    fireEvent.change(capacityInput, { target: { value: "16" } })
    expect(onAdjustmentChange).toHaveBeenCalledWith("course-1", {
      capacity: 16,
    })
  })
})
