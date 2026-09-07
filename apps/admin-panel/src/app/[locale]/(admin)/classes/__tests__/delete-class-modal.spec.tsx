import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { DeleteClassModal } from "../components/delete-class-modal"
import type { ClassDto } from "@workspace/types"

// Mock sonner toast
vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockClass: ClassDto = {
  id: "cls-1",
  instituteId: "inst-1",
  termId: "term-1",
  courseId: "course-1",
  title: "کلاس فشرده مکالمه",
  capacity: 20,
  enrolledCount: 0,
  fee: 1500000,
  teacherName: "دکتر کاظمی",
  schedule: "یکشنبه و سه‌شنبه ۱۶:۰۰ تا ۱۸:۰۰",
  daysOfWeek: ["SUNDAY", "TUESDAY"],
  sessionDates: ["2026-10-04", "2026-10-06"],
  startTime: "16:00",
  endTime: "18:00",
  branch: {
    id: "branch-1",
    name: "شعبه مرکزی",
  },
  term: {
    id: "term-1",
    title: "پاییز ۱۴۰۵",
    isActive: true,
  },
  course: {
    id: "course-1",
    title: "English Conversation",
    baseFee: 1500000,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("DeleteClassModal Component", () => {
  it("should render warning dialog with class details when open", () => {
    render(<DeleteClassModal open={true} onClose={vi.fn()} cls={mockClass} />)

    expect(
      screen.getByRole("heading", { name: /حذف کلاس|delete class/i })
    ).toBeInTheDocument()
    expect(screen.getByText("کلاس فشرده مکالمه")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /حذف کلاس|delete class/i })
    ).toBeInTheDocument()
  })

  it("should trigger onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <DeleteClassModal open={true} onClose={handleClose} cls={mockClass} />
    )

    const cancelBtn = screen.getByRole("button", { name: /انصراف|cancel/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalled()
  })
})
