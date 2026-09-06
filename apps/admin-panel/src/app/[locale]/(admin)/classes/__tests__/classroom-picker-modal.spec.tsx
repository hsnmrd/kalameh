import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ClassroomPickerModal } from "../components/classroom-picker-modal"
import type { ClassroomDto } from "@workspace/types"

const mockClassrooms: ClassroomDto[] = [
  {
    id: "room-1",
    instituteId: "inst-1",
    branchId: "branch-1",
    name: "اتاق ۱۰۱",
    capacity: 25,
    description: "کلاس مجهز به ویدئو پروژکتور",
    isActive: true,
    branch: { id: "branch-1", name: "شعبه مرکزی" },
    classesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "room-2",
    instituteId: "inst-1",
    branchId: "branch-1",
    name: "اتاق ۲۰۲ (آزمایشگاه)",
    capacity: 10,
    description: "اتاق کوچک آزمایشگاه زبان",
    isActive: true,
    branch: { id: "branch-1", name: "شعبه مرکزی" },
    classesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe("ClassroomPickerModal", () => {
  it("renders the modal title, search input, and classroom list when open", () => {
    render(
      <ClassroomPickerModal
        open={true}
        onClose={vi.fn()}
        classrooms={mockClassrooms}
        selectedClassroomId={null}
        onSelectClassroom={vi.fn()}
      />
    )

    expect(
      screen.getByRole("heading", { name: /انتخاب کلاس درس \/ اتاق فیزیکی/i })
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/جستجوی نام یا مشخصات اتاق/i)
    ).toBeInTheDocument()
    expect(screen.getByText("بدون اتاق / کلاس آنلاین")).toBeInTheDocument()
    expect(screen.getByText("اتاق ۱۰۱")).toBeInTheDocument()
    expect(screen.getByText("اتاق ۲۰۲ (آزمایشگاه)")).toBeInTheDocument()
  })

  it("filters classrooms by search query", () => {
    render(
      <ClassroomPickerModal
        open={true}
        onClose={vi.fn()}
        classrooms={mockClassrooms}
        selectedClassroomId={null}
        onSelectClassroom={vi.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText(
      /جستجوی نام یا مشخصات اتاق/i
    )
    fireEvent.change(searchInput, { target: { value: "آزمایشگاه" } })

    expect(screen.getByText("اتاق ۲۰۲ (آزمایشگاه)")).toBeInTheDocument()
    expect(screen.queryByText("اتاق ۱۰۱")).not.toBeInTheDocument()
  })

  it("calls onSelectClassroom and onClose when a classroom is selected", () => {
    const handleSelect = vi.fn()
    const handleClose = vi.fn()

    render(
      <ClassroomPickerModal
        open={true}
        onClose={handleClose}
        classrooms={mockClassrooms}
        selectedClassroomId={null}
        onSelectClassroom={handleSelect}
      />
    )

    fireEvent.click(screen.getByText("اتاق ۱۰۱"))

    expect(handleSelect).toHaveBeenCalledWith("room-1")
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it("calls onSelectClassroom('REMOTE') when selecting online/no classroom option", () => {
    const handleSelect = vi.fn()
    const handleClose = vi.fn()

    render(
      <ClassroomPickerModal
        open={true}
        onClose={handleClose}
        classrooms={mockClassrooms}
        selectedClassroomId="room-1"
        onSelectClassroom={handleSelect}
      />
    )

    fireEvent.click(screen.getByText("بدون اتاق / کلاس آنلاین"))

    expect(handleSelect).toHaveBeenCalledWith("REMOTE")
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it("shows warning when class capacity exceeds room capacity", () => {
    render(
      <ClassroomPickerModal
        open={true}
        onClose={vi.fn()}
        classrooms={mockClassrooms}
        selectedClassroomId={null}
        classCapacity={18}
        onSelectClassroom={vi.fn()}
      />
    )

    // room-2 has capacity 10, so with classCapacity 18 it should show warning
    expect(
      screen.getByText(/گنجایش اتاق کمتر از ظرفیت کلاس است/i)
    ).toBeInTheDocument()
  })
})
