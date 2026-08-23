import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { StudentsTable } from "../components/students-table"
import { StudentsFilter } from "../components/students-filter"
import type { StudentDto } from "@workspace/types"

describe("StudentsTable & StudentsFilter Components", () => {
  const mockStudents: StudentDto[] = [
    {
      id: "student-1",
      instituteId: "inst-1",
      firstName: "Ali",
      lastName: "Rezaei",
      phone: "09121111111",
      nationalCode: "0012345678",
      role: "STUDENT",
      isActive: true,
      currentAllowedCourseId: "course-1",
      currentAllowedCourse: {
        id: "course-1",
        title: "Starter 101",
        baseFee: 500000,
      },
      studentProfile: {
        fatherName: "Reza",
        gender: "MALE",
        emergencyPhone: "09129998877",
      },
      enrollmentsCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "student-2",
      instituteId: "inst-1",
      firstName: "Sara",
      lastName: "Ahmadi",
      phone: "09122222222",
      nationalCode: "0098765432",
      role: "STUDENT",
      isActive: false,
      currentAllowedCourseId: null,
      studentProfile: {
        fatherName: "Mohammad",
        gender: "FEMALE",
      },
      enrollmentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  describe("StudentsTable", () => {
    it("should render loading spinner when isLoading is true", () => {
      const { container } = render(
        <StudentsTable
          students={undefined}
          isLoading={true}
          onViewProfile={vi.fn()}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
        />
      )

      expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
    })

    it("should render empty state message when students array is empty", () => {
      render(
        <StudentsTable
          students={[]}
          isLoading={false}
          onViewProfile={vi.fn()}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
        />
      )

      expect(
        screen.getByText(/فراگیری|هیچ فراگیری|No students found/i)
      ).toBeInTheDocument()
    })

    it("should render student rows with names, father names, and phone numbers", () => {
      render(
        <StudentsTable
          students={mockStudents}
          isLoading={false}
          onViewProfile={vi.fn()}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
        />
      )

      expect(screen.getAllByText("Ali Rezaei").length).toBeGreaterThan(0)
      expect(
        screen.getAllByText(/09121111111|۰۹۱۲۱۱۱۱۱۱۱/).length
      ).toBeGreaterThan(0)
      expect(screen.getAllByText("Reza").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Sara Ahmadi").length).toBeGreaterThan(0)
    })

    it("should trigger onViewProfile and onEdit callbacks when buttons are clicked", () => {
      const onViewProfileMock = vi.fn()
      const onEditMock = vi.fn()
      const onResetPasswordMock = vi.fn()

      render(
        <StudentsTable
          students={mockStudents}
          isLoading={false}
          onViewProfile={onViewProfileMock}
          onEdit={onEditMock}
          onResetPassword={onResetPasswordMock}
        />
      )

      const profileButtons = screen.getAllByTitle(/مشاهده پرونده|View Profile/i)
      fireEvent.click(profileButtons[0]!)
      expect(onViewProfileMock).toHaveBeenCalledWith(mockStudents[0])

      const editButtons = screen.getAllByTitle(/ویرایش|Edit/i)
      fireEvent.click(editButtons[0]!)
      expect(onEditMock).toHaveBeenCalledWith(mockStudents[0])
    })
  })

  describe("StudentsFilter", () => {
    it("should render search input and emit change events", () => {
      const onSearchChangeMock = vi.fn()

      render(
        <StudentsFilter
          searchValue=""
          onSearchChange={onSearchChangeMock}
          selectedCourseId="ALL"
          onCourseChange={vi.fn()}
          selectedStatus="ALL"
          onStatusChange={vi.fn()}
          courses={[]}
        />
      )

      const searchInput = screen.getByPlaceholderText(
        /جستجو با نام|Search by name/i
      )
      fireEvent.change(searchInput, { target: { value: "Ali" } })
      expect(onSearchChangeMock).toHaveBeenCalledWith("Ali")
    })
  })
})
