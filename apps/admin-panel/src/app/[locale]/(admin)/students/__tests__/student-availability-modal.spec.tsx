import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { StudentAvailabilityModal } from "../components/student-availability-modal"
import * as stores from "@/lib/stores"
import { operatingPhasesResource, studentsResource } from "@/lib/api"
import type { StudentDto, OperatingPhaseWithSlots } from "@workspace/types"

vi.mock("@/lib/stores", () => ({
  useActiveInstitute: vi.fn(),
}))

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
    studentsResource: {
      ...actual.studentsResource,
      getAvailabilities: {
        toQuery: vi.fn(),
        baseKey: vi.fn(() => ["students", "availabilities"]),
      },
      updateAvailabilities: {
        toMutation: vi.fn(),
      },
      list: {
        baseKey: vi.fn(() => ["students", "list"]),
      },
      detail: {
        key: vi.fn((id: string) => ["students", "detail", id]),
      },
    },
  }
})

const mockStudent: StudentDto = {
  id: "student-123",
  instituteId: "inst-1",
  role: "STUDENT",
  firstName: "Ali",
  lastName: "Mohammadi",
  phone: "09121112233",
  nationalCode: "0012345678",
  avatarUrl: null,
  isActive: true,
  enrollmentsCount: 0,
  studentProfile: {
    id: "profile-1",
    userId: "student-123",
    fatherName: "Hassan",
    birthDate: null,
    gender: "MALE",
    emergencyPhone: null,
    address: null,
    scheduleStatus: "INCOMPLETE",
    schoolShift: "FLEXIBLE",
    dayPreference: "ANY",
    availabilities: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockPhases: OperatingPhaseWithSlots[] = [
  {
    id: "phase-fall",
    instituteId: "inst-1",
    title: "پاییز",
    months: [7, 8, 9],
    startTime: "15:00",
    endTime: "21:00",
    slotDurationMinutes: 90,
    daysOfWeek: ["SATURDAY", "MONDAY", "WEDNESDAY"],
    hasBreak: false,
    breakStartTime: null,
    breakEndTime: null,
    isActive: true,
    order: 1,
    calculation: {
      totalSpanMinutes: 360,
      instructionalMinutes: 360,
      fullSlotsCount: 4,
      remainderMinutes: 0,
      slots: [
        {
          slotNumber: 1,
          startTime: "15:00",
          endTime: "16:30",
          durationMinutes: 90,
        },
        {
          slotNumber: 2,
          startTime: "16:30",
          endTime: "18:00",
          durationMinutes: 90,
        },
        {
          slotNumber: 3,
          startTime: "18:00",
          endTime: "19:30",
          durationMinutes: 90,
        },
        {
          slotNumber: 4,
          startTime: "19:30",
          endTime: "21:00",
          durationMinutes: 90,
        },
      ],
      hasWarning: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

describe("StudentAvailabilityModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(stores.useActiveInstitute).mockReturnValue({
      activeInstituteId: "inst-1",
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        subdomain: "test",
        enabledModules: ["STUDENTS"],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as any)

    vi.mocked(operatingPhasesResource.list.toQuery).mockReturnValue({
      queryKey: ["operating-phases", "list", { instituteId: "inst-1" }],
      queryFn: vi.fn().mockResolvedValue(mockPhases),
    } as any)

    vi.mocked(studentsResource.getAvailabilities.toQuery).mockReturnValue({
      queryKey: ["students", "availabilities", "student-123", "phase-fall"],
      queryFn: vi.fn().mockResolvedValue([]),
    } as any)

    vi.mocked(studentsResource.updateAvailabilities.toMutation).mockReturnValue(
      {
        mutationFn: vi.fn().mockResolvedValue([]),
      } as any
    )
  })

  it("should render modal title and student name when open", () => {
    render(
      <StudentAvailabilityModal
        student={mockStudent}
        open={true}
        onClose={vi.fn()}
        instituteId="inst-1"
      />
    )

    expect(
      screen.getByText(/برنامه حضور فراگیر|Student Availability Schedule/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Ali Mohammadi/i)).toBeInTheDocument()
  })

  it("should not render content when closed", () => {
    render(
      <StudentAvailabilityModal
        student={mockStudent}
        open={false}
        onClose={vi.fn()}
        instituteId="inst-1"
      />
    )

    expect(
      screen.queryByText(/برنامه حضور فراگیر|Student Availability Schedule/i)
    ).not.toBeInTheDocument()
  })

  it("should trigger onClose when cancel button is clicked", () => {
    const onCloseMock = vi.fn()
    render(
      <StudentAvailabilityModal
        student={mockStudent}
        open={true}
        onClose={onCloseMock}
        instituteId="inst-1"
      />
    )

    const cancelButton = screen.getByText(/انصراف|Cancel/i)
    fireEvent.click(cancelButton)
    expect(onCloseMock).toHaveBeenCalled()
  })

  it("should render phase selector and track slot row with slots", async () => {
    render(
      <StudentAvailabilityModal
        student={mockStudent}
        open={true}
        onClose={vi.fn()}
        instituteId="inst-1"
      />
    )

    await waitFor(() => {
      expect(screen.getByText("پاییز")).toBeInTheDocument()
      expect(screen.getByText("15:00 - 16:30")).toBeInTheDocument()
    })
  })
})
