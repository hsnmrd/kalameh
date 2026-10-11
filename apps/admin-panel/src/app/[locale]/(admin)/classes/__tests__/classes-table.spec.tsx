import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { formatNumber } from "@workspace/ui/lib/utils"
import { ClassesTable } from "../components/classes-table"
import type { ClassDto } from "@workspace/types"

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/classes",
  useIsRtl: () => true,
}))

describe("ClassesTable Component", () => {
  const mockClasses: ClassDto[] = [
    {
      id: "class-1",
      instituteId: "inst-1",
      termId: "term-1",
      courseId: "course-1",
      title: "گروه A",
      capacity: 15,
      fee: 1500000,
      teacherName: "دکتر احمدی",
      schedule: "زوج ۱۷:۰۰ تا ۱۸:۳۰",
      enrolledCount: 8,
      course: { id: "course-1", title: "Top Notch 1A", baseFee: 1500000 },
      term: { id: "term-1", title: "پاییز ۱۴۰۵", isActive: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("should render loading spinner when isLoading is true", () => {
    const { container } = render(
      <ClassesTable classes={undefined} isLoading={true} onEdit={vi.fn()} />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("should render class details and capacity ratio", () => {
    render(
      <ClassesTable classes={mockClasses} isLoading={false} onEdit={vi.fn()} />
    )
    expect(screen.getByText("گروه A")).toBeInTheDocument()
    expect(screen.getByText("دکتر احمدی")).toBeInTheDocument()
    expect(
      screen.getByText(`${formatNumber(8, "fa")} / ${formatNumber(15, "fa")}`)
    ).toBeInTheDocument()
  })

  it("should have link to grades page", () => {
    render(
      <ClassesTable classes={mockClasses} isLoading={false} onEdit={vi.fn()} />
    )
    const gradesBtn = screen.getByRole("button", { name: /ثبت نمرات|grades/i })
    expect(gradesBtn).toBeInTheDocument()
  })

  it("should call onDelete when delete button is clicked", () => {
    const handleDelete = vi.fn()
    render(
      <ClassesTable
        classes={mockClasses}
        isLoading={false}
        onEdit={vi.fn()}
        onDelete={handleDelete}
      />
    )
    const deleteBtn = screen.getByRole("button", { name: /حذف کلاس|delete/i })
    expect(deleteBtn).toBeInTheDocument()
    fireEvent.click(deleteBtn)
    expect(handleDelete).toHaveBeenCalledWith(mockClasses[0])
  })

  it("should render both primary smart scheduling and outline addClass buttons in empty state", () => {
    const handleAdd = vi.fn()
    const handleScheduling = vi.fn()

    render(
      <ClassesTable
        classes={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onAdd={handleAdd}
        onScheduling={handleScheduling}
      />
    )

    const schedulingBtn = screen.getByRole("button", {
      name: /تقویم آموزشی هوشمند|smart academic calendar|زمان‌بندی هوشمند|scheduling/i,
    })
    const addBtn = screen.getByRole("button", {
      name: /تعریف کلاس جدید|افزودن کلاس|addClass/i,
    })

    expect(schedulingBtn).toBeInTheDocument()
    expect(addBtn).toBeInTheDocument()

    fireEvent.click(schedulingBtn)
    expect(handleScheduling).toHaveBeenCalledTimes(1)

    fireEvent.click(addBtn)
    expect(handleAdd).toHaveBeenCalledTimes(1)
  })

  it("should apply low opacity and ended badge to classes whose duration is finished", () => {
    const finishedClass: ClassDto = {
      ...mockClasses[0]!,
      id: "class-finished",
      title: "گروه B",
      sessionDates: ["2026-01-01", "2026-01-10"],

      term: {
        id: "term-past",
        title: "ترم گذشته",
        isActive: true,
        endDate: "2026-01-15",
      },
    }

    const { container } = render(
      <ClassesTable
        classes={[mockClasses[0]!, finishedClass]}
        isLoading={false}
        onEdit={vi.fn()}
      />
    )

    const rows = container.querySelectorAll("tbody tr")
    expect(rows).toHaveLength(2)

    // First class is active (not finished) -> no opacity-60
    expect(rows[0]?.className).not.toContain("opacity-60")

    // Second class is finished -> has opacity-60
    expect(rows[1]?.className).toContain("opacity-60")
    expect(screen.getByText(/پایان‌یافته|finished/i)).toBeInTheDocument()
  })
})
