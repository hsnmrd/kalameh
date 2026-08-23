import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../../../test/test-utils"
import { GradesTable } from "../components/grades-table"
import type { ClassGradeRecordDto } from "@workspace/types"

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/classes/class-1/grades",
  useIsRtl: () => true,
}))

describe("GradesTable Component", () => {
  const mockRecords: ClassGradeRecordDto[] = [
    {
      enrollmentId: "enr-1",
      studentId: "student-1",
      student: {
        id: "student-1",
        firstName: "Ali",
        lastName: "Rezaei",
        phone: "09121111111",
        currentAllowedCourseId: null,
      },
      finalScore: 85,
      isPassed: true,
      status: "ENROLLED",
    },
  ]

  it("should render student names, scores, and pass status", () => {
    render(
      <GradesTable
        records={mockRecords}
        isLoading={false}
        isSubmitting={false}
        onSubmit={vi.fn()}
      />
    )

    expect(screen.getByText("Ali Rezaei")).toBeInTheDocument()
    expect(screen.getByText(/09121111111|۰۹۱۲۱۱۱۱۱۱۱/)).toBeInTheDocument()
    expect(screen.getByDisplayValue("85")).toBeInTheDocument()
  })

  it("should trigger onSubmit with updated grades when finalize button is clicked", () => {
    const handleSubmit = vi.fn()
    render(
      <GradesTable
        records={mockRecords}
        isLoading={false}
        isSubmitting={false}
        onSubmit={handleSubmit}
      />
    )

    const submitBtn = screen.getByRole("button", {
      name: /ثبت و نهایی‌سازی نمرات|submit/i,
    })
    fireEvent.click(submitBtn)

    expect(handleSubmit).toHaveBeenCalledWith([
      {
        studentId: "student-1",
        finalScore: 85,
        isPassed: true,
      },
    ])
  })
})
