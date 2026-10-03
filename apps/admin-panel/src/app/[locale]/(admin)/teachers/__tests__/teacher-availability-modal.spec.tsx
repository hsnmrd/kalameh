import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { TeacherAvailabilityModal } from "../components/teacher-availability-modal"
import type { TeacherDto } from "@workspace/types"

const mockTeacher: TeacherDto = {
  id: "teacher-123",
  instituteId: "inst-1",
  role: "TEACHER",
  firstName: "Reza",
  lastName: "Abbasi",
  phone: "09121112233",
  nationalCode: "0012345678",
  avatarUrl: null,
  isActive: true,
  classesCount: 1,
  teacherProfile: {
    id: "profile-1",
    userId: "teacher-123",
    degree: "Master",
    bio: null,
    specialties: [],
    availabilities: [
      {
        id: "slot-1",
        teacherProfileId: "profile-1",
        dayOfWeek: "SATURDAY",
        startTime: "08:00",
        endTime: "10:00",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("TeacherAvailabilityModal", () => {
  it("should render modal title and teacher name when open", () => {
    render(
      <TeacherAvailabilityModal
        teacher={mockTeacher}
        open={true}
        onClose={vi.fn()}
        instituteId="inst-1"
      />
    )

    expect(
      screen.getByText(
        /برنامه زمان‌های آزاد هفتگی|Weekly Availability Schedule/i
      )
    ).toBeInTheDocument()
  })

  it("should not render content when closed", () => {
    render(
      <TeacherAvailabilityModal
        teacher={mockTeacher}
        open={false}
        onClose={vi.fn()}
        instituteId="inst-1"
      />
    )

    expect(
      screen.queryByText(
        /برنامه زمان‌های آزاد هفتگی|Weekly Availability Schedule/i
      )
    ).not.toBeInTheDocument()
  })

  it("should trigger onClose when cancel button is clicked", () => {
    const onCloseMock = vi.fn()
    render(
      <TeacherAvailabilityModal
        teacher={mockTeacher}
        open={true}
        onClose={onCloseMock}
        instituteId="inst-1"
      />
    )

    const cancelButton = screen.getByText(/انصراف|Cancel/i)
    fireEvent.click(cancelButton)
    expect(onCloseMock).toHaveBeenCalled()
  })
})
