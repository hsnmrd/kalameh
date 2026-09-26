import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "../../../../../test/test-utils"
import type { CourseDemandSummaryDto } from "@workspace/types"
import { DemandBreakdownDrawer } from "../components/scheduling-demand-view/demand-breakdown-drawer"

const mockCourses: CourseDemandSummaryDto[] = [
  {
    courseId: "course-1",
    courseTitle: "American English File 2",
    baseFee: 1_200_000,
    prerequisiteId: "course-prereq",
    prerequisiteTitle: "American English File 1",
    eligibleStudentsCount: 29,
    passedPrerequisiteCount: 20,
    continuingStudentsCount: 20,
    newPlacementCount: 9,
    morningShiftCount: 10,
    afternoonShiftCount: 10,
    flexibleShiftCount: 9,
    evenDaysPreferenceCount: 15,
    oddDaysPreferenceCount: 14,
    anyDayPreferenceCount: 0,
    suggestedClassCount: 2,
    suggestedClasses: [
      { key: "course-1:1", capacity: 15 },
      { key: "course-1:2", capacity: 14 },
    ],
    plannedCapacity: 29,
    uncoveredStudentCount: 0,
  },
]

describe("DemandBreakdownDrawer", () => {
  it("renders separate editable class rows on desktop and mobile", () => {
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        suggestions={{ "course-1": mockCourses[0]!.suggestedClasses }}
        capacityLimit={20}
        onCapacityChange={vi.fn()}
        onAddClass={vi.fn()}
        onRemoveClass={vi.fn()}
      />
    )

    expect(screen.getByText("نام دوره")).toBeInTheDocument()
    expect(screen.getAllByText("American English File 2")).toHaveLength(2)
    expect(screen.getAllByText("کلاس ۱")).toHaveLength(2)
    expect(screen.getAllByText("کلاس ۲")).toHaveLength(2)
    expect(screen.getAllByText("۲۹ صندلی برنامه‌ریزی‌شده")).toHaveLength(2)
    expect(screen.getAllByText("پوشش کامل")).toHaveLength(2)
  })

  it("edits, adds, and removes individual suggested classes", () => {
    const onCapacityChange = vi.fn()
    const onAddClass = vi.fn()
    const onRemoveClass = vi.fn()
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        suggestions={{ "course-1": mockCourses[0]!.suggestedClasses }}
        capacityLimit={20}
        onCapacityChange={onCapacityChange}
        onAddClass={onAddClass}
        onRemoveClass={onRemoveClass}
      />
    )

    const firstCapacity = screen.getAllByLabelText(
      /ظرفیت هر کلاس - American English File 2 - کلاس ۱/
    )[0]!
    fireEvent.change(firstCapacity, { target: { value: "16" } })
    expect(onCapacityChange).toHaveBeenCalledWith("course-1", "course-1:1", 16)

    fireEvent.click(screen.getAllByRole("button", { name: "افزودن کلاس" })[0]!)
    expect(onAddClass).toHaveBeenCalledWith("course-1")

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /حذف کلاس - American English File 2 - کلاس ۱/,
      })[0]!
    )
    expect(onRemoveClass).toHaveBeenCalledWith("course-1", "course-1:1")
  })

  it("shows uncovered students when reviewed seats are short", () => {
    render(
      <DemandBreakdownDrawer
        courses={mockCourses}
        suggestions={{
          "course-1": [{ key: "course-1:1", capacity: 14 }],
        }}
        capacityLimit={20}
        onCapacityChange={vi.fn()}
        onAddClass={vi.fn()}
        onRemoveClass={vi.fn()}
      />
    )

    expect(screen.getAllByText("۱۵ نفر بدون ظرفیت")).toHaveLength(2)
  })
})
