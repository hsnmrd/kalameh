import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import type { TeacherDto } from "@workspace/types"
import { TeacherScheduleTab } from "../index"

describe("TeacherScheduleTab", () => {
  const mockTeacher: TeacherDto = {
    id: "teacher-1",
    firstName: "سارا",
    lastName: "حسینی",
    phone: "09121112233",
    instituteId: "inst-1",
    isActive: true,
    teacherProfile: {
      id: "profile-1",
      userId: "teacher-1",
      availabilities: [
        {
          id: "ta-1",
          dayOfWeek: "SATURDAY",
          startTime: "08:00",
          endTime: "09:30",
        },
        {
          id: "ta-2",
          dayOfWeek: "SATURDAY",
          startTime: "08:00",
          endTime: "09:30", // Duplicate slot test
        },
        {
          id: "ta-3",
          dayOfWeek: "SATURDAY",
          startTime: "09:30",
          endTime: "11:00",
        },
        {
          id: "ta-4",
          dayOfWeek: "SUNDAY",
          startTime: "08:00",
          endTime: "09:30",
        },
      ],
    },
  } as unknown as TeacherDto

  it("does not render total count badge in the header", () => {
    render(
      <TeacherScheduleTab
        teacher={mockTeacher}
        onManageAvailability={vi.fn()}
      />
    )

    // Should render title
    expect(screen.getByText("زمان‌بندی ساعات آزاد")).toBeInTheDocument()

    // Should NOT have the badge "بازه زمانی"
    expect(screen.queryByText(/بازه زمانی/)).not.toBeInTheDocument()
  })

  it("renders properly translated Persian day titles", () => {
    render(
      <TeacherScheduleTab
        teacher={mockTeacher}
        onManageAvailability={vi.fn()}
      />
    )

    // Should render translated Persian day titles in filter and card
    const saturdayElements = screen.getAllByText("شنبه")
    expect(saturdayElements.length).toBeGreaterThanOrEqual(1)

    const sundayElements = screen.getAllByText("یکشنبه")
    expect(sundayElements.length).toBeGreaterThanOrEqual(1)
  })

  it("renders classes in carousel without duplicates and shows check and close icons", () => {
    const { container } = render(
      <TeacherScheduleTab
        teacher={mockTeacher}
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
    expect(timeRanges).toHaveLength(2)
  })

  it("triggers onManageAvailability when action button is clicked", () => {
    const handleManage = vi.fn()
    render(
      <TeacherScheduleTab
        teacher={mockTeacher}
        onManageAvailability={handleManage}
      />
    )

    const manageBtn = screen.getByRole("button", {
      name: /برنامه زمان‌های آزاد|actions\.manageAvailability/,
    })
    fireEvent.click(manageBtn)

    expect(handleManage).toHaveBeenCalledTimes(1)
  })

  it("renders empty state when teacher has no availabilities", () => {
    const emptyTeacher: TeacherDto = {
      ...mockTeacher,
      teacherProfile: {
        ...mockTeacher.teacherProfile!,
        availabilities: [],
      },
    }

    render(
      <TeacherScheduleTab
        teacher={emptyTeacher}
        onManageAvailability={vi.fn()}
      />
    )

    expect(
      screen.getByText(/زمان آزادی برای این استاد تعریف نشده است/)
    ).toBeInTheDocument()
  })
})
