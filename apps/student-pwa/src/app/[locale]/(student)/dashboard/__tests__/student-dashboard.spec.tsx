import { describe, it, expect, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import StudentDashboardPage from "../page"
import dashboardMessagesFa from "../../../../../messages/fa/dashboard.json"
import commonMessagesFa from "../../../../../messages/fa/common.json"
import enrollmentsMessagesFa from "../../../../../messages/fa/enrollments.json"
import { enrollmentsResource } from "@/lib/api"
import { ENROLLMENT_STATUSES } from "@workspace/types"

vi.mock("@/lib/api", () => ({
  enrollmentsResource: {
    my: {
      toQuery: vi.fn(),
      baseKey: vi.fn(() => ["enrollments", "my"]),
    },
  },
}))

describe("StudentDashboardPage", () => {
  const customMessages = {
    dashboard: dashboardMessagesFa,
    common: commonMessagesFa,
    enrollments: enrollmentsMessagesFa,
  }

  it("should show empty/select class card when user only has a REJECTED enrollment", () => {
    vi.mocked(enrollmentsResource.my.toQuery).mockReturnValue({
      queryKey: ["enrollments", "my"],
      queryFn: vi.fn(),
      initialData: [
        {
          id: "enr-rejected",
          studentId: "student-1",
          classId: "class-1",
          status: ENROLLMENT_STATUSES.REJECTED,
          class: {
            id: "class-1",
            title: "Rejected Class",
            term: { id: "term-1", title: "Term 1", isActive: true },
          },
        },
      ] as any,
    } as any)

    render(<StudentDashboardPage />, { messages: customMessages })

    // ActiveEnrollmentCard should show noEnrollmentTitle / selectClass
    expect(
      screen.getByText(dashboardMessagesFa.noEnrollmentTitle)
    ).toBeInTheDocument()
    expect(
      screen.getByText(dashboardMessagesFa.selectClass)
    ).toBeInTheDocument()
    expect(screen.queryByText("Rejected Class")).not.toBeInTheDocument()
  })

  it("should show active enrollment card when user has an ENROLLED class", () => {
    vi.mocked(enrollmentsResource.my.toQuery).mockReturnValue({
      queryKey: ["enrollments", "my"],
      queryFn: vi.fn(),
      initialData: [
        {
          id: "enr-active",
          studentId: "student-1",
          classId: "class-2",
          status: ENROLLMENT_STATUSES.ENROLLED,
          class: {
            id: "class-2",
            title: "English Level 1",
            term: { id: "term-1", title: "پاییز ۱۴۰۵", isActive: true },
          },
        },
      ] as any,
    } as any)

    render(<StudentDashboardPage />, { messages: customMessages })

    expect(screen.getByText("English Level 1")).toBeInTheDocument()
    expect(screen.getByText("پاییز ۱۴۰۵")).toBeInTheDocument()
  })
})
