import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import commonMessagesFa from "@/messages/fa/common.json"
import schedulingMessagesFa from "@/messages/fa/scheduling.json"
import {
  SchedulingPlanCalendarGroupTeachersCarousel,
  type GroupTeacherAccessibilityItem,
} from "../index"

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider
      locale="fa"
      messages={{
        common: commonMessagesFa,
        scheduling: schedulingMessagesFa,
      }}
    >
      {ui}
    </NextIntlClientProvider>
  )
}

describe("SchedulingPlanCalendarGroupTeachersCarousel", () => {
  const mockTeachers: GroupTeacherAccessibilityItem[] = [
    {
      teacher: {
        id: "t1",
        firstName: "سارا",
        lastName: "حسینی",
        avatarUrl: null,
      },
      status: "AVAILABLE",
      levelRange: "سطح ۱ تا ۵",
      suggestedCourseTitle: "American English File 1",
      isSelected: false,
    },
    {
      teacher: {
        id: "t2",
        firstName: "علی",
        lastName: "محمدی",
        avatarUrl: null,
      },
      status: "TEACHING",
      teachingClassTitle: "کلاس صبح سطح A1",
      isSelected: false,
    },
  ]

  it("returns null when teachers list is empty", () => {
    const { container } = renderWithIntl(
      <SchedulingPlanCalendarGroupTeachersCarousel
        track="EVEN"
        slotKey="09:00-10:30"
        teachers={[]}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders header, total count badge, and cards for both available and teaching teachers", () => {
    renderWithIntl(
      <SchedulingPlanCalendarGroupTeachersCarousel
        track="EVEN"
        slotKey="09:00-10:30"
        teachers={mockTeachers}
      />
    )

    expect(screen.getByText("دسترسی اساتید")).toBeInTheDocument()
    expect(
      screen.getByTestId("group-teachers-count-badge-EVEN-09:00-10:30")
    ).toHaveTextContent("۲ استاد")

    // Available teacher
    const t1Card = screen.getByTestId("group-teacher-card-t1-EVEN-09:00-10:30")
    expect(t1Card).toBeInTheDocument()
    expect(t1Card).toHaveTextContent("سارا حسینی")
    expect(
      screen.getByTestId("teacher-status-badge-t1-EVEN-09:00-10:30")
    ).toHaveTextContent("در دسترس")
    expect(t1Card).toHaveTextContent("American English File 1")

    // Teaching teacher (has class in that time)
    const t2Card = screen.getByTestId("group-teacher-card-t2-EVEN-09:00-10:30")
    expect(t2Card).toBeInTheDocument()
    expect(t2Card).toHaveTextContent("علی محمدی")
    expect(
      screen.getByTestId("teacher-status-badge-t2-EVEN-09:00-10:30")
    ).toHaveTextContent("در حال تدریس")
    expect(t2Card).toHaveTextContent("کلاس صبح سطح A1")
  })

  it("calls onSelectTeacher when a teacher card is clicked", () => {
    const onSelectTeacher = vi.fn()
    renderWithIntl(
      <SchedulingPlanCalendarGroupTeachersCarousel
        track="EVEN"
        slotKey="09:00-10:30"
        teachers={mockTeachers}
        onSelectTeacher={onSelectTeacher}
      />
    )

    const t2Card = screen.getByTestId("group-teacher-card-t2-EVEN-09:00-10:30")
    fireEvent.click(t2Card)
    expect(onSelectTeacher).toHaveBeenCalledWith("t2")
  })

  it("marks card as selected and applies active styles when isSelected is true", () => {
    const selectedTeachers = mockTeachers.map((item) =>
      item.teacher.id === "t1" ? { ...item, isSelected: true } : item
    )

    renderWithIntl(
      <SchedulingPlanCalendarGroupTeachersCarousel
        track="EVEN"
        slotKey="09:00-10:30"
        teachers={selectedTeachers}
      />
    )

    const t1Card = screen.getByTestId("group-teacher-card-t1-EVEN-09:00-10:30")
    expect(t1Card).toHaveAttribute("data-selected", "true")
    expect(t1Card).toHaveClass("border-primary", "bg-primary/10")
  })
})
