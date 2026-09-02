import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ClassDetailsModal } from "../components/class-details-modal"
import type { ClassDto } from "@workspace/types"

describe("ClassDetailsModal Component", () => {
  const mockClass: ClassDto = {
    id: "cls-1",
    instituteId: "inst-1",
    termId: "term-1",
    courseId: "course-1",
    title: "کلاس سطح پیشرفته A",
    capacity: 20,
    enrolledCount: 12,
    fee: 1800000,
    teacherName: "دکتر مهدوی",
    schedule: "شنبه، دوشنبه (17:00 - 18:30)",
    daysOfWeek: ["SATURDAY", "MONDAY"],
    sessionDates: ["2026-10-01", "2026-10-03"],
    startTime: "17:00",
    endTime: "18:30",
    branch: {
      id: "branch-1",
      name: "شعبه مرکزی",
    },
    classroom: {
      id: "room-1",
      name: "اتاق ۱۰۲",
      capacity: 25,
    },
    term: {
      id: "term-1",
      title: "پاییز ۱۴۰۵",
      isActive: true,
    },
    course: {
      id: "course-1",
      title: "Top Notch 3A",
      baseFee: 1800000,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("should render null when cls is null", () => {
    const { container } = render(
      <ClassDetailsModal cls={null} open={true} onClose={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("should render class details and metrics when opened", () => {
    render(<ClassDetailsModal cls={mockClass} open={true} onClose={vi.fn()} />)

    expect(screen.getByText("کلاس سطح پیشرفته A")).toBeInTheDocument()
    expect(screen.getByText("Top Notch 3A")).toBeInTheDocument()
    expect(screen.getByText("پاییز ۱۴۰۵")).toBeInTheDocument()
    expect(screen.getByText("دکتر مهدوی")).toBeInTheDocument()
    expect(screen.getByText("شعبه مرکزی")).toBeInTheDocument()
    expect(screen.getByText("اتاق ۱۰۲")).toBeInTheDocument()
  })

  it("should toggle session dates list when clicking session dates toggle", () => {
    render(<ClassDetailsModal cls={mockClass} open={true} onClose={vi.fn()} />)

    const toggleBtn = screen.getByText(/مشاهده تقویم جلسات/i)
    fireEvent.click(toggleBtn)

    expect(screen.getByText(/#۱/i)).toBeInTheDocument()
    expect(screen.getByText(/#۲/i)).toBeInTheDocument()
  })

  it("should call onEdit and onClose when edit button is clicked", () => {
    const handleEdit = vi.fn()
    const handleClose = vi.fn()

    render(
      <ClassDetailsModal
        cls={mockClass}
        open={true}
        onClose={handleClose}
        onEdit={handleEdit}
      />
    )

    const editBtn = screen.getByRole("button", { name: /ویرایش کلاس/i })
    fireEvent.click(editBtn)

    expect(handleClose).toHaveBeenCalled()
    expect(handleEdit).toHaveBeenCalledWith(mockClass)
  })
})
