import { describe, it, expect, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
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
    expect(screen.getByText("8 / 15")).toBeInTheDocument()
  })

  it("should have link to grades page", () => {
    render(
      <ClassesTable classes={mockClasses} isLoading={false} onEdit={vi.fn()} />
    )
    const gradesBtn = screen.getByRole("button", { name: /ثبت نمرات|grades/i })
    expect(gradesBtn).toBeInTheDocument()
  })
})
