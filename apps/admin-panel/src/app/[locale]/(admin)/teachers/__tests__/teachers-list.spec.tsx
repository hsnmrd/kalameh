import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { TeachersList } from "../components/teachers-list"
import type { TeacherDto } from "@workspace/types"

describe("TeachersList Component", () => {
  const mockTeachers: TeacherDto[] = [
    {
      id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      instituteId: "inst-1",
      role: "TEACHER",
      firstName: "Ali",
      lastName: "Moradi",
      phone: "09121112233",
      nationalCode: "0012345678",
      avatarUrl: null,
      isActive: true,
      classesCount: 2,
      teacherProfile: {
        id: "prof-1",
        userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        degree: "M.A. in TEFL",
        bio: "Experienced English teacher",
        specialties: ["IELTS"],
        availabilities: [
          {
            dayOfWeek: "SATURDAY",
            startTime: "09:00",
            endTime: "12:00",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e",
      instituteId: "inst-1",
      role: "TEACHER",
      firstName: "Maryam",
      lastName: "Hosseini",
      phone: "09123334455",
      nationalCode: "0098765432",
      avatarUrl: null,
      isActive: false,
      classesCount: 0,
      teacherProfile: {
        id: "prof-2",
        userId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e",
        degree: "Ph.D. in Linguistics",
        bio: null,
        specialties: [],
        availabilities: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("should render loading skeleton when isLoading is true", () => {
    const { container } = render(
      <TeachersList
        teachers={undefined}
        isLoading={true}
        onViewProfile={vi.fn()}
        onEdit={vi.fn()}
        onManageAvailability={vi.fn()}
        onResetPassword={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0
    )
  })

  it("should render empty state message and add master button when teachers array is empty", () => {
    const onAddMock = vi.fn()

    render(
      <TeachersList
        teachers={[]}
        isLoading={false}
        onViewProfile={vi.fn()}
        onEdit={vi.fn()}
        onManageAvailability={vi.fn()}
        onResetPassword={vi.fn()}
        onDelete={vi.fn()}
        onAdd={onAddMock}
      />
    )

    expect(
      screen.getByText(/استادی یافت نشد|No teachers found/i)
    ).toBeInTheDocument()

    const addButton = screen.getByRole("button", {
      name: /افزودن استاد|add teacher/i,
    })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)
    expect(onAddMock).toHaveBeenCalledTimes(1)
  })

  it("should render teacher list items with name and phone", () => {
    render(
      <TeachersList
        teachers={mockTeachers}
        isLoading={false}
        onViewProfile={vi.fn()}
        onEdit={vi.fn()}
        onManageAvailability={vi.fn()}
        onResetPassword={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getByText("Ali Moradi")).toBeInTheDocument()
    expect(screen.getByText("09121112233")).toBeInTheDocument()
    expect(screen.getByText("Maryam Hosseini")).toBeInTheDocument()
    expect(screen.getByText("09123334455")).toBeInTheDocument()
  })

  it("should trigger onViewProfile when a teacher list item is clicked", () => {
    const onViewProfileMock = vi.fn()

    render(
      <TeachersList
        teachers={mockTeachers}
        isLoading={false}
        onViewProfile={onViewProfileMock}
        onEdit={vi.fn()}
        onManageAvailability={vi.fn()}
        onResetPassword={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    const teacherItem = screen
      .getByText("Ali Moradi")
      .closest('[role="listitem"]')
    expect(teacherItem).toBeInTheDocument()
    if (teacherItem) {
      fireEvent.click(teacherItem)
      expect(onViewProfileMock).toHaveBeenCalledWith(mockTeachers[0])
    }
  })
})
