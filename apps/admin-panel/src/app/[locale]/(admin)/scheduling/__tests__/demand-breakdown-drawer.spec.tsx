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
  it("renders both desktop table and mobile cards directly and displays course details", () => {
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        adjustments={{}}
        onAdjustmentChange={vi.fn()}
      />
    )

    // The toggle button is NOT present (no collapsible)
    expect(
      screen.queryByText(/مشاهده و ویرایش جزئیات دوره‌ها/)
    ).not.toBeInTheDocument()

    // Desktop table headers are visible
    expect(screen.getByText("نام دوره")).toBeInTheDocument()
    expect(screen.getByText("متقاضیان")).toBeInTheDocument()

    // Course title and applicants are rendered in both desktop table and mobile card
    expect(screen.getAllByText("American English File 2")).toHaveLength(2)
    expect(
      screen.getAllByText(/۱۰ ارتقا از ترم قبل \+ ۵ تعیین‌سطح = ۱۵ نفر/)
    ).toHaveLength(2)

    // Inputs exist for both desktop table and mobile card
    expect(
      screen.getAllByLabelText(/تعداد کلاس پیشنهادی - American English File 2/)
    ).toHaveLength(2)
    expect(
      screen.getAllByLabelText(/ظرفیت هر کلاس - American English File 2/)
    ).toHaveLength(2)
  })

  it("calls onAdjustmentChange when modifying suggested classes and capacity from desktop or mobile", () => {
    const onAdjustmentChange = vi.fn()
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        adjustments={{}}
        onAdjustmentChange={onAdjustmentChange}
      />
    )

    const classInputs = screen.getAllByLabelText(
      /تعداد کلاس پیشنهادی - American English File 2/
    )
    // Desktop input change
    fireEvent.change(classInputs[0]!, { target: { value: "3" } })
    expect(onAdjustmentChange).toHaveBeenCalledWith("course-1", {
      suggestedClassCount: 3,
    })

    // Mobile card input change
    fireEvent.change(classInputs[1]!, { target: { value: "4" } })
    expect(onAdjustmentChange).toHaveBeenCalledWith("course-1", {
      suggestedClassCount: 4,
    })

    const capacityInputs = screen.getAllByLabelText(
      /ظرفیت هر کلاس - American English File 2/
    )
    // Desktop capacity change
    fireEvent.change(capacityInputs[0]!, { target: { value: "16" } })
    expect(onAdjustmentChange).toHaveBeenCalledWith("course-1", {
      capacity: 16,
    })

    // Mobile card capacity change
    fireEvent.change(capacityInputs[1]!, { target: { value: "18" } })
    expect(onAdjustmentChange).toHaveBeenCalledWith("course-1", {
      capacity: 18,
    })
  })

  it("increments and decrements counter values using plus and minus buttons", () => {
    const onAdjustmentChange = vi.fn()
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        adjustments={{}}
        onAdjustmentChange={onAdjustmentChange}
      />
    )

    const increaseButtons = screen.getAllByRole("button", { name: "افزایش" })
    const decreaseButtons = screen.getAllByRole("button", { name: "کاهش" })

    // Click increment on first counter (suggested classes: initial 2 -> 3)
    fireEvent.click(increaseButtons[0]!)
    expect(onAdjustmentChange).toHaveBeenCalledWith("course-1", {
      suggestedClassCount: 3,
    })

    // Click decrement on second counter (capacity: initial 14 -> 13)
    fireEvent.click(decreaseButtons[1]!)
    expect(onAdjustmentChange).toHaveBeenCalledWith("course-1", {
      capacity: 13,
    })
  })
})
