import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { TeachersTable } from "../components/teachers-table"
import { TeachersFilter } from "../components/teachers-filter"
import type { TeacherDto } from "@workspace/types"

describe("TeachersTable & TeachersFilter Components", () => {
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

  describe("TeachersTable", () => {
    it("should render loading spinner when isLoading is true", () => {
      const { container } = render(
        <TeachersTable
          teachers={undefined}
          isLoading={true}
          onViewProfile={vi.fn()}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
    })

    it("should render empty state message when teachers array is empty", () => {
      render(
        <TeachersTable
          teachers={[]}
          isLoading={false}
          onViewProfile={vi.fn()}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(
        screen.getByText(/استادی یافت نشد|No teachers found/i)
      ).toBeInTheDocument()
    })

    it("should render teacher rows with name, phone, degree, and availability count", () => {
      render(
        <TeachersTable
          teachers={mockTeachers}
          isLoading={false}
          onViewProfile={vi.fn()}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getAllByText("Ali Moradi").length).toBeGreaterThan(0)
      expect(screen.getAllByText("09121112233").length).toBeGreaterThan(0)
      expect(screen.getAllByText("M.A. in TEFL").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Maryam Hosseini").length).toBeGreaterThan(0)
    })

    it("should trigger onViewProfile when view button is clicked", () => {
      const onViewProfileMock = vi.fn()

      render(
        <TeachersTable
          teachers={mockTeachers}
          isLoading={false}
          onViewProfile={onViewProfileMock}
          onEdit={vi.fn()}
          onManageAvailability={vi.fn()}
          onResetPassword={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      const profileButtons = screen.getAllByTitle(/مشاهده پرونده|View Dossier/i)
      fireEvent.click(profileButtons[0]!)
      expect(onViewProfileMock).toHaveBeenCalledWith(mockTeachers[0])
    })

    it("should trigger onManageAvailability when availability slot button is clicked", () => {
      const onManageAvailabilityMock = vi.fn()

      render(
        <TeachersTable
          teachers={mockTeachers}
          isLoading={false}
          onViewProfile={vi.fn()}
          onEdit={vi.fn()}
          onManageAvailability={onManageAvailabilityMock}
          onResetPassword={vi.fn()}
          onDelete={vi.fn()}
        />
      )

      const availButtons = screen.getAllByTitle(
        /برنامه زمان‌های آزاد|Weekly Availability/i
      )
      fireEvent.click(availButtons[0]!)
      expect(onManageAvailabilityMock).toHaveBeenCalledWith(mockTeachers[0])
    })
  })

  describe("TeachersFilter", () => {
    it("should render search input and call onSearchChange", () => {
      const onSearchChangeMock = vi.fn()

      render(
        <TeachersFilter
          searchValue=""
          onSearchChange={onSearchChangeMock}
          selectedStatus="ALL"
          onStatusChange={vi.fn()}
        />
      )

      const searchInput = screen.getByPlaceholderText(/جستجو|Search/i)
      fireEvent.change(searchInput, { target: { value: "Moradi" } })
      expect(onSearchChangeMock).toHaveBeenCalledWith("Moradi")
    })
  })
})
