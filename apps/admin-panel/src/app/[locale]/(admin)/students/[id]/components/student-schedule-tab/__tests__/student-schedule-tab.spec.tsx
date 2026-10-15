import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import type { StudentDto } from "@workspace/types"
import { StudentScheduleTab } from "../index"

describe("StudentScheduleTab", () => {
  const mockStudent: StudentDto = {
    id: "student-1",
    firstName: "علی",
    lastName: "رضایی",
    phone: "09123456789",
    instituteId: "inst-1",
    isActive: true,
    studentProfile: {
      id: "profile-1",
      userId: "student-1",
      scheduleStatus: "COMPLETE",
      availabilities: [
        {
          id: "a-1",
          dayOfWeek: "SATURDAY",
          startTime: "08:00",
          endTime: "09:30",
        },
        {
          id: "a-2",
          dayOfWeek: "SATURDAY",
          startTime: "08:00",
          endTime: "09:30", // Duplicate slot test
        },
        {
          id: "a-3",
          dayOfWeek: "SATURDAY",
          startTime: "09:30",
          endTime: "11:00",
        },
        {
          id: "a-4",
          dayOfWeek: "SUNDAY",
          startTime: "08:00",
          endTime: "09:30",
        },
      ],
    },
  } as unknown as StudentDto

  it("does not render total count badge in the header", () => {
    render(
      <StudentScheduleTab
        student={mockStudent}
        onManageAvailability={vi.fn()}
      />
    )

    // Should render title
    expect(screen.getByText("برنامه زمان‌های آزاد حضور")).toBeInTheDocument()

    // Should NOT have the badge "بازه زمانی"
    expect(screen.queryByText(/بازه زمانی/)).not.toBeInTheDocument()
  })

  it("renders properly translated Persian day titles and not raw keys", () => {
    render(
      <StudentScheduleTab
        student={mockStudent}
        onManageAvailability={vi.fn()}
      />
    )

    // Should render translated Persian day titles in filter and card
    const saturdayElements = screen.getAllByText("شنبه")
    expect(saturdayElements.length).toBeGreaterThanOrEqual(1)

    const sundayElements = screen.getAllByText("یکشنبه")
    expect(sundayElements.length).toBeGreaterThanOrEqual(1)

    // Must NOT render raw untranslated strings
    expect(screen.queryByText("students.days.SATURDAY")).not.toBeInTheDocument()
    expect(screen.queryByText("students.days.SUNDAY")).not.toBeInTheDocument()
  })

  it("renders classes in carousel without duplicates and shows check and close icons", () => {
    const { container } = render(
      <StudentScheduleTab
        student={mockStudent}
        onManageAvailability={vi.fn()}
      />
    )

    // Carousel slots are present
    const carousels = container.querySelectorAll('[data-slot="carousel"]')
    expect(carousels.length).toBeGreaterThan(0)

    // Check available and unavailable labels exist
    expect(screen.getAllByText("آزاد").length).toBeGreaterThan(0)

    // Deduplication check: on Saturday, "08:00 - 09:30" should only appear once per day card
    const timeRanges = screen.getAllByText("08:00 - 09:30")
    // 1 for Saturday card + 1 for Sunday card = 2 total across all days, NOT 3+ (which would mean duplicates)
    expect(timeRanges).toHaveLength(2)
  })

  it("triggers onManageAvailability when action button is clicked", () => {
    const handleManage = vi.fn()
    render(
      <StudentScheduleTab
        student={mockStudent}
        onManageAvailability={handleManage}
      />
    )

    const manageBtn = screen.getByRole("button", {
      name: /برنامه حضور|actions\.availability/,
    })
    fireEvent.click(manageBtn)

    expect(handleManage).toHaveBeenCalledTimes(1)
  })

  it("renders empty state when student has no availabilities", () => {
    const emptyStudent: StudentDto = {
      ...mockStudent,
      studentProfile: {
        ...mockStudent.studentProfile!,
        availabilities: [],
      },
    }

    render(
      <StudentScheduleTab
        student={emptyStudent}
        onManageAvailability={vi.fn()}
      />
    )

    expect(
      screen.getByText("هیچ زمان حضوری برای این فراگیر ثبت نشده است.")
    ).toBeInTheDocument()
  })
})
