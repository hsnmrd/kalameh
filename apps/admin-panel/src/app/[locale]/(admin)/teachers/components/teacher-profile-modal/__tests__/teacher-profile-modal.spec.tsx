import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../../../test/test-utils"
import { TeacherProfileModal } from "../index"
import type { TeacherDto } from "@workspace/types"

const mockTeacherWithAvailabilities: TeacherDto = {
  id: "teacher-1",
  instituteId: "inst-1",
  role: "TEACHER",
  firstName: "علی",
  lastName: "محمدی",
  phone: "09123456789",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  teacherProfile: {
    id: "profile-1",
    userId: "teacher-1",
    bio: "استاد زبان انگلیسی با ۱۰ سال سابقه",
    degree: "کارشناسی ارشد آموزش زبان",
    specialties: ["IELTS", "Conversation"],
    availabilities: [
      {
        id: "avail-1",
        teacherProfileId: "profile-1",
        branchId: "branch-1",
        dayOfWeek: "SATURDAY",
        startTime: "08:00",
        endTime: "10:00",
        branch: { id: "branch-1", name: "شعبه مرکزی" },
        term: { id: "term-1", title: "ترم پاییز" },
      },
      {
        id: "avail-2",
        teacherProfileId: "profile-1",
        branchId: "branch-1",
        dayOfWeek: "SATURDAY",
        startTime: "14:00",
        endTime: "16:00",
        branch: { id: "branch-1", name: "شعبه مرکزی" },
      },
      {
        id: "avail-3",
        teacherProfileId: "profile-1",
        branchId: "branch-2",
        dayOfWeek: "MONDAY",
        startTime: "10:00",
        endTime: "12:00",
        branch: { id: "branch-2", name: "شعبه ونک" },
      },
    ],
    teachableCourses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

const mockTeacherWithoutAvailabilities: TeacherDto = {
  ...mockTeacherWithAvailabilities,
  id: "teacher-2",
  teacherProfile: {
    ...mockTeacherWithAvailabilities.teacherProfile!,
    id: "profile-2",
    availabilities: [],
  },
}

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    teachersResource: {
      ...actual.teachersResource,
      detail: {
        toQuery: vi.fn((id: string) => ({
          queryKey: ["teacher", "detail", id],
          queryFn: () =>
            id === "teacher-1"
              ? mockTeacherWithAvailabilities
              : mockTeacherWithoutAvailabilities,
        })),
      },
    },
  }
})

describe("TeacherProfileModal - AvailabilitySchedule redesign", () => {
  it("renders grouped schedule slots by weekday without carousel controls", async () => {
    const onManage = vi.fn()
    const onClose = vi.fn()

    render(
      <TeacherProfileModal
        teacher={mockTeacherWithAvailabilities}
        open={true}
        onClose={onClose}
        onManageAvailability={onManage}
      />
    )

    // Wait for teacher profile data to load
    await waitFor(() => {
      expect(screen.getByText("علی محمدی")).toBeInTheDocument()
    })

    // Verify Saturday group (has 2 slots)
    expect(screen.getByText("شنبه")).toBeInTheDocument()
    expect(screen.getByText("08:00 - 10:00")).toBeInTheDocument()
    expect(screen.getByText("14:00 - 16:00")).toBeInTheDocument()
    expect(screen.getByText("(ترم پاییز)")).toBeInTheDocument()

    // Verify Monday group (has 1 slot)
    expect(screen.getByText("دوشنبه")).toBeInTheDocument()
    expect(screen.getByText("10:00 - 12:00")).toBeInTheDocument()
    expect(screen.getByText("شعبه ونک")).toBeInTheDocument()

    // Carousel buttons should NOT exist
    expect(
      screen.queryByRole("button", { name: /previous/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /next/i })
    ).not.toBeInTheDocument()
  })

  it("calls onManageAvailability when the manage button is clicked", async () => {
    const onManage = vi.fn()
    const onClose = vi.fn()

    render(
      <TeacherProfileModal
        teacher={mockTeacherWithAvailabilities}
        open={true}
        onClose={onClose}
        onManageAvailability={onManage}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("تعیین زمان‌های آزاد")).toBeInTheDocument()
    })

    const manageBtn = screen.getByText("تعیین زمان‌های آزاد")
    fireEvent.click(manageBtn)

    expect(onClose).not.toHaveBeenCalled()
    expect(onManage).toHaveBeenCalledWith(mockTeacherWithAvailabilities)
  })

  it("displays empty state when teacher has no availabilities", async () => {
    render(
      <TeacherProfileModal
        teacher={mockTeacherWithoutAvailabilities}
        open={true}
        onClose={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(
        screen.getByText(
          "زمان آزادی برای این استاد تعریف نشده است (امکان ثبت کلاس در هر ساعتی وجود دارد)."
        )
      ).toBeInTheDocument()
    })
  })
})
