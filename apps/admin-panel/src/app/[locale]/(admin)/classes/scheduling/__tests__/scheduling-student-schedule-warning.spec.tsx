import { describe, expect, it, vi, afterEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@/test/test-utils"
import type { ClassRequirementDto, StudentDto } from "@workspace/types"
import { studentsResource } from "@/lib/api"
import * as stores from "@/lib/stores"
import { SchedulingStudentScheduleWarning } from "../components/scheduling-student-schedule-warning"

const instituteId = "11111111-1111-4111-8111-111111111111"
const courseOneId = "c1111111-1111-4111-8111-111111111111"
const courseTwoId = "c2222222-2222-4222-8222-222222222222"

const mockRequirements: ClassRequirementDto[] = [
  {
    id: "req-1",
    instituteId,
    termId: "term-1",
    courseId: courseOneId,
    branchId: null,
    requiredClassCount: 2,
    capacity: 12,
    sessionDurationMinutes: 90,
    sessionsPerWeek: 2,
    totalSessions: null,
    deliveryMode: "IN_PERSON",
    isActive: true,
    term: { id: "term-1", title: "ترم پاییز" },
    course: { id: courseOneId, title: "AME 5-5" },
    branch: null,
    createdAt: "2026-08-01",
    updatedAt: "2026-08-01",
  },
  {
    id: "req-2",
    instituteId,
    termId: "term-1",
    courseId: courseTwoId,
    branchId: null,
    requiredClassCount: 1,
    capacity: 10,
    sessionDurationMinutes: 90,
    sessionsPerWeek: 2,
    totalSessions: null,
    deliveryMode: "IN_PERSON",
    isActive: true,
    term: { id: "term-1", title: "ترم پاییز" },
    course: { id: courseTwoId, title: "AME 1-1" },
    branch: null,
    createdAt: "2026-08-01",
    updatedAt: "2026-08-01",
  },
]

const mockStudents: StudentDto[] = [
  {
    id: "student-1",
    instituteId,
    firstName: "کیان",
    lastName: "کریمی",
    phone: "09901000313",
    role: "STUDENT",
    isActive: true,
    currentAllowedCourseId: courseOneId,
    currentAllowedCourse: { id: courseOneId, title: "AME 5-5" },
    studentProfile: {
      scheduleStatus: "INCOMPLETE",
      schoolShift: "MORNING",
      dayPreference: "ODD_DAYS",
    },
    createdAt: "2026-08-01",
    updatedAt: "2026-08-01",
  },
  {
    id: "student-2",
    instituteId,
    firstName: "سارا",
    lastName: "احمدی",
    phone: "09901000314",
    role: "STUDENT",
    isActive: true,
    currentAllowedCourseId: courseTwoId,
    currentAllowedCourse: { id: courseTwoId, title: "AME 1-1" },
    studentProfile: {
      scheduleStatus: "COMPLETE",
      schoolShift: "FLEXIBLE",
      dayPreference: "ANY",
    },
    createdAt: "2026-08-01",
    updatedAt: "2026-08-01",
  },
]

describe("SchedulingStudentScheduleWarning", () => {
  afterEach(() => vi.restoreAllMocks())

  it("renders collapsible warning when incomplete students exist for selected requirements", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: null,
      setActiveInstitute: vi.fn(),
      clearActiveInstitute: vi.fn(),
    })
    vi.spyOn(studentsResource.list, "toQuery").mockReturnValue({
      queryKey: ["students", instituteId],
      queryFn: async () => mockStudents,
    } as never)

    render(
      <SchedulingStudentScheduleWarning
        requirements={mockRequirements}
        selectedRequirementIds={["req-1"]}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          /فراگیر در این دوره‌ها فاقد برنامه حضور هستند|unconfirmed schedules/i
        )
      ).toBeInTheDocument()
    })

    const toggleButton = screen.getByText(/مشاهده اسامی|View names/i)
    expect(toggleButton).toBeInTheDocument()

    // Expand
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByText("کیان کریمی")).toBeInTheDocument()
      expect(screen.getByText("09901000313")).toBeInTheDocument()
    })
  })

  it("renders nothing when all students in selected requirements have complete schedule", async () => {
    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstituteId: instituteId,
      activeInstitute: null,
      setActiveInstitute: vi.fn(),
      clearActiveInstitute: vi.fn(),
    })
    vi.spyOn(studentsResource.list, "toQuery").mockReturnValue({
      queryKey: ["students", instituteId],
      queryFn: async () => mockStudents,
    } as never)

    const { container } = render(
      <SchedulingStudentScheduleWarning
        requirements={mockRequirements}
        selectedRequirementIds={["req-2"]}
      />
    )

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })
})
