import { describe, it, expect } from "vitest"
import { render, screen } from "@/test/test-utils"
import {
  BookCoursesPreviewCarousel,
  type BookCoursePreviewItem,
} from "../index"

describe("BookCoursesPreviewCarousel", () => {
  const mockItems: BookCoursePreviewItem[] = [
    {
      title: "Advanced Grammar in Use - 1",
      prerequisiteText: "بدون پیش‌نیاز",
    },
    {
      title: "Advanced Grammar in Use - 2",
      prerequisiteText: "Advanced Grammar in Use - 1",
    },
    {
      title: "Advanced Grammar in Use - 3",
      prerequisiteText: "Advanced Grammar in Use - 2",
    },
  ]

  it("renders null when items array is empty", () => {
    const { container } = render(<BookCoursesPreviewCarousel items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders course titles and prerequisites in separate sections", () => {
    render(<BookCoursesPreviewCarousel items={mockItems} />)

    expect(screen.getAllByText("Advanced Grammar in Use - 1")).toHaveLength(2) // Once as title for item 1, once as prerequisite for item 2
    expect(screen.getAllByText("Advanced Grammar in Use - 2")).toHaveLength(2) // Once as title for item 2, once as prerequisite for item 3
    expect(screen.getByText("Advanced Grammar in Use - 3")).toBeInTheDocument()
    expect(screen.getByText("بدون پیش‌نیاز")).toBeInTheDocument()
  })

  it("renders 1-based index badges for all items", () => {
    render(<BookCoursesPreviewCarousel items={mockItems} />)

    const badge1 = screen.getByText("1")
    const badge2 = screen.getByText("2")
    const badge3 = screen.getByText("3")

    expect(badge1).toBeInTheDocument()
    expect(badge2).toBeInTheDocument()
    expect(badge3).toBeInTheDocument()
    expect(badge1.className).toContain("size-7")
  })
})
