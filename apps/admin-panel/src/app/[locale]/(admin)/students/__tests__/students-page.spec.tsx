import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "../../../../../test/test-utils"
import StudentsPage from "../page"
import * as stores from "@/lib/stores"
import * as hooks from "@/lib/hooks"
import {
  operatingPhasesResource,
  coursesResource,
  studentsResource,
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
})
