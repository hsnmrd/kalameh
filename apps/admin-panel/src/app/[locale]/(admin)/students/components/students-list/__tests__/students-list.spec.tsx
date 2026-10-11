import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { StudentsList } from "../index"
import type { StudentDto } from "@workspace/types"

describe("StudentsList Component", () => {
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
      branch: {
        id: "branch-1",
        name: "شعبه مرکزی",
      },
      studentProfile: {
        fatherName: "Reza",
        gender: "MALE",
        emergencyPhone: "09129998877",
        scheduleStatus: "COMPLETE",
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
      branch: {
        id: "branch-2",
        name: "شعبه غرب",
      },
      studentProfile: {
        fatherName: "Mohammad",
        gender: "FEMALE",
        scheduleStatus: "INCOMPLETE",
      },
      enrollmentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("should render student levels instead of active/inactive badges in trailing section", () => {
    render(
      <StudentsList
        students={mockStudents}
        isLoading={false}
        onViewProfile={vi.fn()}
        onAddNote={vi.fn()}
        onEdit={vi.fn()}
        onResetPassword={vi.fn()}
      />
    )

    // Level badge for active student with course
    expect(screen.getByText("Starter 101")).toBeInTheDocument()

    // Level badge for student without course
    expect(screen.getByText(/تعیین سطح نشده|Not Assigned/i)).toBeInTheDocument()

    // The standalone "فعال" text should NOT be rendered in the list items
    expect(screen.queryByText(/^فعال$/)).not.toBeInTheDocument()
  })

  it("should show a gray circle AvatarBadge on the avatar for disabled students and NOT for active students", () => {
    const { container } = render(
      <StudentsList
        students={mockStudents}
        isLoading={false}
        onViewProfile={vi.fn()}
        onAddNote={vi.fn()}
        onEdit={vi.fn()}
        onResetPassword={vi.fn()}
      />
    )

    // Exactly one gray indicator for the inactive student
    const disabledDots = container.querySelectorAll(
      "[data-slot='avatar-badge']"
    )
    expect(disabledDots.length).toBe(1)

    // The dot should be placed on student-2's avatar with bg-muted-foreground
    const inactiveBadge = screen.getByLabelText(/غیرفعال|Inactive/i)
    expect(inactiveBadge).toBeInTheDocument()
    expect(inactiveBadge).toHaveAttribute("data-slot", "avatar-badge")
    expect(inactiveBadge).toHaveClass("bg-muted-foreground")
    expect(inactiveBadge).toHaveClass("rounded-full")
    expect(inactiveBadge).toHaveClass("absolute")
  })

  it("should call onViewProfile when student item is clicked", () => {
    const handleViewProfile = vi.fn()

    render(
      <StudentsList
        students={mockStudents}
        isLoading={false}
        onViewProfile={handleViewProfile}
        onAddNote={vi.fn()}
        onEdit={vi.fn()}
        onResetPassword={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText("Ali Rezaei"))
    expect(handleViewProfile).toHaveBeenCalledWith(mockStudents[0])
  })

  it("should render schedule status icon in front of student name with 4px gap", () => {
    render(
      <StudentsList
        students={mockStudents}
        isLoading={false}
        onViewProfile={vi.fn()}
        onAddNote={vi.fn()}
        onEdit={vi.fn()}
        onResetPassword={vi.fn()}
      />
    )

    // Complete student has Check icon in front of name
    const completeIcon = screen.getByLabelText(/مشخص شده|Complete/i)
    expect(completeIcon).toBeInTheDocument()
    expect(completeIcon.parentElement).toHaveClass("text-success")
    expect(completeIcon.closest(".flex.items-center.gap-1")).toBeInTheDocument()

    // Incomplete student has Clock icon in front of name
    const incompleteIcon = screen.getByLabelText(/نیاز به تماس|Incomplete/i)
    expect(incompleteIcon).toBeInTheDocument()
    expect(incompleteIcon.parentElement).toHaveClass("text-muted-foreground")
    expect(
      incompleteIcon.closest(".flex.items-center.gap-1")
    ).toBeInTheDocument()
  })

  it("should render empty state when no students are provided", () => {
    render(
      <StudentsList
        students={[]}
        isLoading={false}
        onViewProfile={vi.fn()}
        onAddNote={vi.fn()}
        onEdit={vi.fn()}
        onResetPassword={vi.fn()}
      />
    )

    expect(
      screen.getByText(/فراگیری|هیچ فراگیری|No students found/i)
    ).toBeInTheDocument()
  })
})
