import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { CoursesTable } from "../components/courses-table"
import type { CourseDto } from "@workspace/types"

describe("CoursesTable Component", () => {
  const mockCourses: CourseDto[] = [
    {
      id: "course-1",
      instituteId: "inst-1",
      title: "Top Notch 1A",
      baseFee: 1500000,
      prerequisiteId: null,
      prerequisite: null,
      classesCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "course-2",
      instituteId: "inst-1",
      title: "Top Notch 1B",
      baseFee: 1600000,
      prerequisiteId: "course-1",
      prerequisite: { id: "course-1", title: "Top Notch 1A" },
      classesCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("should render loading spinner when isLoading is true", () => {
    const { container } = render(
      <CoursesTable courses={undefined} isLoading={true} onEdit={vi.fn()} />
    )
    expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
  })

  it("should render course titles and prerequisite badges", () => {
    render(
      <CoursesTable courses={mockCourses} isLoading={false} onEdit={vi.fn()} />
    )
    expect(screen.getAllByText("Top Notch 1A").length).toBeGreaterThan(0)
    expect(screen.getByText("Top Notch 1B")).toBeInTheDocument()
    expect(screen.getByText(/سطح پایه|Base Level/i)).toBeInTheDocument()
    expect(screen.getByText("TN 1A")).toBeInTheDocument()
  })

  it("should trigger onEdit when edit button is clicked", () => {
    const handleEdit = vi.fn()
    render(
      <CoursesTable
        courses={mockCourses}
        isLoading={false}
        onEdit={handleEdit}
      />
    )
    const editBtns = screen.getAllByLabelText(/عملیات|actions/i)
    fireEvent.click(editBtns[0]!)
    expect(handleEdit).toHaveBeenCalledWith(mockCourses[0])
  })

  it("should render both primary group course and outline single course buttons when empty", () => {
    const handleAdd = vi.fn()
    const handleBatch = vi.fn()
    render(
      <CoursesTable
        courses={[]}
        isLoading={false}
        onEdit={vi.fn()}
        onAdd={handleAdd}
        onBatch={handleBatch}
      />
    )

    // Primary button: create group courses
    const batchBtn = screen.getByRole("button", {
      name: /ایجاد گروهی دوره‌ها|generate group courses/i,
    })
    expect(batchBtn).toBeInTheDocument()

    // Secondary button: create single course
    const addBtn = screen.getByRole("button", {
      name: /تعریف تکی دوره|create single course|addCourse/i,
    })
    expect(addBtn).toBeInTheDocument()

    fireEvent.click(batchBtn)
    expect(handleBatch).toHaveBeenCalledTimes(1)

    fireEvent.click(addBtn)
    expect(handleAdd).toHaveBeenCalledTimes(1)
  })
})
