import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "../../../../../test/test-utils"
import StudentsPage from "../page"
import * as stores from "@/lib/stores"
import * as hooks from "@/lib/hooks"
import {
  operatingPhasesResource,
  coursesResource,
  studentsResource,
  termsResource,
} from "@/lib/api"

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: vi.fn(),
}))

vi.mock("@/lib/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/hooks")>()
  return {
    ...actual,
    usePermissions: vi.fn(),
  }
})

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    operatingPhasesResource: {
      ...actual.operatingPhasesResource,
      list: {
        toQuery: vi.fn(),
      },
    },
    coursesResource: {
      ...actual.coursesResource,
      list: {
        toQuery: vi.fn(),
      },
    },
    studentsResource: {
      ...actual.studentsResource,
      list: {
        toQuery: vi.fn(),
      },
    },
    termsResource: {
      ...actual.termsResource,
      list: {
        toQuery: vi.fn(),
      },
    },
  }
})

describe("StudentsPage Operating Phase Requirement", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(stores.useActiveInstitute).mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        subdomain: "test",
        enabledModules: ["STUDENTS", "CLASSES_COURSES"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      setActiveInstitute: vi.fn(),
      clearActiveInstitute: vi.fn(),
    })
    vi.mocked(hooks.usePermissions).mockReturnValue({
      user: {
        id: "user-1",
        role: "ADMIN",
        phone: "09121111111",
        firstName: "Admin",
        lastName: "User",
        isActive: true,
      },
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasRole: () => true,
      canAccessModule: () => true,
      isSuperAdmin: false,
    } as any)

    vi.mocked(coursesResource.list.toQuery).mockReturnValue({
      queryKey: ["courses", "list"],
      queryFn: async () => [],
    } as any)

    vi.mocked(studentsResource.list.toQuery).mockReturnValue({
      queryKey: ["students", "list"],
      queryFn: async () => [],
    } as any)

    vi.mocked(termsResource.list.toQuery).mockReturnValue({
      queryKey: ["terms", "list"],
      queryFn: async () => [],
    } as any)
  })

  it("should show NoOperatingPhaseAlert instead of table and keep filter bar disabled when no operating phases", async () => {
    vi.mocked(operatingPhasesResource.list.toQuery).mockReturnValue({
      queryKey: ["operating-phases", "list", "empty"],
      queryFn: async () => [],
    } as any)

    render(<StudentsPage />)

    // NoOperatingPhaseAlert content should be rendered after query resolves
    expect(
      await screen.findByText("فاز زمانی تعریف نشده است")
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "برای مدیریت فراگیران و ثبت زمان‌بندی حضور، ابتدا باید حداقل یک فاز زمانی فعال در آموزشگاه تعریف و تنظیم شود."
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /تعریف فاز زمانی/i })
    ).toHaveAttribute("href", "/operating-phases")

    // Filter bar should be rendered but disabled
    const searchInput = screen.getByPlaceholderText(/جستجو/i)
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toBeDisabled()

    const addStudentButton = screen.getByRole("button", {
      name: /ثبت فراگیر جدید/i,
    })
    expect(addStudentButton).toBeInTheDocument()
    expect(addStudentButton).toBeDisabled()
  })

  it("should render active filter bar and table when institute has operating phases", async () => {
    vi.mocked(operatingPhasesResource.list.toQuery).mockReturnValue({
      queryKey: ["operating-phases", "list", "active"],
      queryFn: async () => [
        {
          id: "phase-1",
          instituteId: "inst-1",
          title: "پاییز",
          months: [7, 8, 9],
          startTime: "15:00",
          endTime: "21:00",
          slotDurationMinutes: 90,
          daysOfWeek: ["SATURDAY", "SUNDAY"],
          hasBreak: false,
          isActive: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    render(<StudentsPage />)

    // Filter bar should become active (not disabled) once operating phases are resolved
    const searchInput = await screen.findByPlaceholderText(/جستجو/i)
    await waitFor(() => {
      expect(searchInput).not.toBeDisabled()
    })

    const addStudentButtons = screen.getAllByRole("button", {
      name: /ثبت فراگیر جدید/i,
    })
    expect(addStudentButtons.length).toBeGreaterThan(0)
    expect(addStudentButtons[0]).not.toBeDisabled()

    // Should NOT show the missing operating phase alert
    expect(
      screen.queryByText("فاز زمانی تعریف نشده است")
    ).not.toBeInTheDocument()
  })

  it("should NOT show StudentScheduleConfirmationBanner when student list is empty even if unconfirmed term exists", async () => {
    vi.mocked(operatingPhasesResource.list.toQuery).mockReturnValue({
      queryKey: ["operating-phases", "list", "active"],
      queryFn: async () => [
        {
          id: "phase-1",
          instituteId: "inst-1",
          title: "پاییز",
          months: [7, 8, 9],
          startTime: "15:00",
          endTime: "21:00",
          slotDurationMinutes: 90,
          daysOfWeek: ["SATURDAY", "SUNDAY"],
          hasBreak: false,
          isActive: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    vi.mocked(termsResource.list.toQuery).mockReturnValue({
      queryKey: ["terms", "list", "unconfirmed"],
      queryFn: async () => [
        {
          id: "term-1",
          instituteId: "inst-1",
          title: "ترم پاییز",
          operatingPhaseId: "phase-1",
          startDate: "2026-10-01",
          endDate: "2026-12-30",
          isActive: true,
          studentSchedulesConfirmedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    // Empty students list
    vi.mocked(studentsResource.list.toQuery).mockReturnValue({
      queryKey: ["students", "list", "empty"],
      queryFn: async () => [],
    } as any)

    render(<StudentsPage />)

    // Wait for page to render
    await screen.findByPlaceholderText(/جستجو/i)

    // The confirmation banner MUST NOT be in the document when list is empty
    expect(
      screen.queryByText("تأیید برنامه زمانی فراگیران")
    ).not.toBeInTheDocument()
  })

  it("should show StudentScheduleConfirmationBanner when students exist in list and term is unconfirmed", async () => {
    vi.mocked(operatingPhasesResource.list.toQuery).mockReturnValue({
      queryKey: ["operating-phases", "list", "active"],
      queryFn: async () => [
        {
          id: "phase-1",
          instituteId: "inst-1",
          title: "پاییز",
          months: [7, 8, 9],
          startTime: "15:00",
          endTime: "21:00",
          slotDurationMinutes: 90,
          daysOfWeek: ["SATURDAY", "SUNDAY"],
          hasBreak: false,
          isActive: true,
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    vi.mocked(termsResource.list.toQuery).mockReturnValue({
      queryKey: ["terms", "list", "unconfirmed"],
      queryFn: async () => [
        {
          id: "term-1",
          instituteId: "inst-1",
          title: "ترم پاییز",
          operatingPhaseId: "phase-1",
          startDate: "2026-10-01",
          endDate: "2026-12-30",
          isActive: true,
          studentSchedulesConfirmedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    // Students list with data
    vi.mocked(studentsResource.list.toQuery).mockReturnValue({
      queryKey: ["students", "list", "with-data"],
      queryFn: async () => [
        {
          id: "student-1",
          firstName: "Ali",
          lastName: "Rezaei",
          phone: "09120000000",
          isActive: true,
          gender: "MALE",
          instituteId: "inst-1",
          nationalCode: "1234567890",
          schedules: [],
          courseAssessments: [],
          notes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    } as any)

    render(<StudentsPage />)

    // The confirmation banner SHOULD be displayed
    expect(
      await screen.findByText("تأیید برنامه زمانی فراگیران")
    ).toBeInTheDocument()
  })
})
