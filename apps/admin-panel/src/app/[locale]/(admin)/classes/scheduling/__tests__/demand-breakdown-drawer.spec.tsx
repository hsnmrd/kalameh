import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/test-utils"
import type { CourseDemandSummaryDto } from "@workspace/types"
import { DemandBreakdownDrawer } from "../components/scheduling-demand-view/demand-breakdown-drawer"
import { StudentDemandBar } from "../components/scheduling-demand-view/demand-breakdown-drawer/student-demand-bar"

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
  it("renders summary columns, starts closed, and opens/closes edit dialog", () => {
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
    expect(screen.getByText("پیشنیاز")).toBeInTheDocument()
    expect(screen.getByText("متقاضیان")).toBeInTheDocument()
    expect(screen.getByText("تعداد کلاس")).toBeInTheDocument()
    expect(screen.getByText("پوشش ظرفیت")).toBeInTheDocument()
    expect(screen.getByText("وضعیت")).toBeInTheDocument()
    expect(screen.getAllByText("American English File 2")).toHaveLength(2)
    expect(screen.getAllByText(/American English File 1/)).toHaveLength(2)
    expect(screen.getAllByText("۲ کلاس")).toHaveLength(2)
    expect(screen.getByText("۲۹ صندلی برنامه‌ریزی‌شده")).toBeInTheDocument()
    expect(screen.getAllByText("پوشش کامل")).toHaveLength(1)
    expect(screen.getByText("پوشش کامل")).toHaveClass("bg-success")

    // Mobile card indicates covered status via start border
    const cards = document.querySelectorAll(".border-s-4")
    expect(cards[0]).toHaveClass("border-s-success")

    // Initially closed
    expect(screen.queryByText("کلاس ۱")).not.toBeInTheDocument()

    // Click edit button to open dialog
    const editButtons = screen.getAllByRole("button", {
      name: /ویرایش کلاس‌ها - American English File 2/,
    })
    fireEvent.click(editButtons[0]!)

    expect(
      screen.getByText("ویرایش کلاس‌های American English File 2")
    ).toBeInTheDocument()
    expect(screen.getByText("کلاس ۱")).toBeInTheDocument()
    expect(screen.getByText("کلاس ۲")).toBeInTheDocument()

    const removeButtons = screen.getAllByRole("button", {
      name: /حذف کلاس - American English File 2 - کلاس ۱/,
    })
    expect(removeButtons).toHaveLength(1)
    const labelSpan = removeButtons[0]!.querySelector("span")
    expect(labelSpan).toHaveClass("sr-only")

    // Clicking confirm button closes the dialog
    const confirmButton = screen.getByRole("button", { name: "تأیید" })
    fireEvent.click(confirmButton)

    expect(screen.queryByText("کلاس ۱")).not.toBeInTheDocument()
  })

  it("edits, adds, and removes individual suggested classes inside the dialog", () => {
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

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /ویرایش کلاس‌ها - American English File 2/,
      })[0]!
    )

    const firstCapacity = screen.getByLabelText(
      /ظرفیت هر کلاس - American English File 2 - کلاس ۱/
    )
    fireEvent.change(firstCapacity, { target: { value: "16" } })
    expect(onCapacityChange).toHaveBeenCalledWith("course-1", "course-1:1", 16)

    fireEvent.click(screen.getByRole("button", { name: "افزودن کلاس" }))
    expect(onAddClass).toHaveBeenCalledWith("course-1")

    fireEvent.click(
      screen.getByRole("button", {
        name: /حذف کلاس - American English File 2 - کلاس ۱/,
      })
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

    expect(screen.getAllByText("۱۵ نفر بدون ظرفیت")).toHaveLength(1)
    const cards = document.querySelectorAll(".border-s-4")
    expect(cards[0]).toHaveClass("border-s-destructive")
  })

  it("StudentDemandBar preserves a visible segment even when count is zero", () => {
    const { container } = render(
      <StudentDemandBar continuing={0} newStudents={8} total={8} />
    )

    expect(screen.getByText("۰")).toBeInTheDocument()
    expect(screen.getByText("۸")).toBeInTheDocument()

    const segments = container.querySelectorAll(".rounded-full")
    expect(segments.length).toBeGreaterThan(0)
  })

  it("StudentDemandBar renders a neutral gray line between tiny indicators when both counts are zero", () => {
    const { container } = render(
      <StudentDemandBar continuing={0} newStudents={0} total={0} />
    )

    const grayLine = container.querySelector(".bg-muted-foreground\\/25")
    expect(grayLine).toBeInTheDocument()
    expect(grayLine).toHaveClass("flex-1")
  })

  it("decreases opacity for rows that do not need any classes", () => {
    const zeroDemandCourses = [
      {
        courseId: "course-zero",
        courseTitle: "دوره بدون تقاضا",
        continuingStudentsCount: 0,
        newPlacementCount: 0,
        eligibleStudentsCount: 0,
        suggestedClasses: [],
      },
    ]

    const { container } = render(
      <DemandBreakdownDrawer
        courses={zeroDemandCourses}
        suggestions={{ "course-zero": [] }}
        capacityLimit={20}
        onCapacityChange={vi.fn()}
        onAddClass={vi.fn()}
        onRemoveClass={vi.fn()}
      />
    )

    const tableRow = container.querySelector("tbody tr")
    expect(tableRow).toHaveClass("opacity-45")
  })
})
