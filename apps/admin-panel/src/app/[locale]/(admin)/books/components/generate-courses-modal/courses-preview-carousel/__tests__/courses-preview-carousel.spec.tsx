import { describe, it, expect } from "vitest"
import { render, screen } from "@/test/test-utils"
import { CoursesPreviewCarousel, type CoursePreviewItem } from "../index"

describe("CoursesPreviewCarousel", () => {
  const mockItems: CoursePreviewItem[] = [
    {
      title: "Advanced Grammar in Use - Part 1",
      prerequisiteText: "بدون پیش‌نیاز",
    },
    {
      title: "Advanced Grammar in Use - Part 2",
      prerequisiteText: "Advanced Grammar in Use - Part 1",
    },
  ]

  it("renders null when items array is empty", () => {
    const { container } = render(<CoursesPreviewCarousel items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders course titles and prerequisites in separate sections", () => {
    render(<CoursesPreviewCarousel items={mockItems} />)

    expect(
      screen.getAllByText("Advanced Grammar in Use - Part 1")
    ).toHaveLength(2)
    expect(
      screen.getByText("Advanced Grammar in Use - Part 2")
    ).toBeInTheDocument()
    expect(screen.getByText("بدون پیش‌نیاز")).toBeInTheDocument()
  })

  it("renders equal-width index badges for items", () => {
    render(<CoursesPreviewCarousel items={mockItems} />)

    const badge1 = screen.getByText("1")
    const badge2 = screen.getByText("2")

    expect(badge1).toBeInTheDocument()
    expect(badge2).toBeInTheDocument()
    expect(badge1.className).toContain("size-7")
    expect(badge2.className).toContain("size-7")
  })
})
