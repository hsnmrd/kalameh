import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { formatNumber } from "@workspace/ui/lib/utils"
import { ClassesList } from "../components/classes-list"
import type { ClassDto } from "@workspace/types"

vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/classes",
  useIsRtl: () => true,
}))

describe("ClassesList Component", () => {
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
      <ClassesList classes={undefined} isLoading={true} onEdit={vi.fn()} />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("should render class item with capacity badge", () => {
    render(
      <ClassesList classes={mockClasses} isLoading={false} onEdit={vi.fn()} />
    )
    expect(screen.getByText("گروه A")).toBeInTheDocument()
    expect(screen.getByText("Top Notch 1A")).toBeInTheDocument()
    expect(
      screen.getByText(`${formatNumber(8, "fa")} / ${formatNumber(15, "fa")}`)
    ).toBeInTheDocument()
  })

  it("should trigger onViewDetails when item is clicked", () => {
    const handleViewDetails = vi.fn()
    render(
      <ClassesList
        classes={mockClasses}
        isLoading={false}
        onEdit={vi.fn()}
        onViewDetails={handleViewDetails}
      />
    )
    const item = screen.getByText("گروه A")
    fireEvent.click(item)
    expect(handleViewDetails).toHaveBeenCalledWith(mockClasses[0])
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
      <ClassesList
        classes={[mockClasses[0]!, finishedClass]}
        isLoading={false}
        onEdit={vi.fn()}
      />
    )

    const items = container.querySelectorAll('[role="listitem"]')
    expect(items).toHaveLength(2)

    // First class is active -> no opacity-60
    expect(items[0]?.className).not.toContain("opacity-60")

    // Second class is finished -> has opacity-60
    expect(items[1]?.className).toContain("opacity-60")
    expect(screen.getByText(/پایان‌یافته|finished/i)).toBeInTheDocument()
  })
})
