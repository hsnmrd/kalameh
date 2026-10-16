import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@/test/test-utils"
import type { TeacherCourseQualification } from "@workspace/types"
import { TeachableCoursesCarousel } from "../index"

describe("TeachableCoursesCarousel", () => {
  const mockQualifications: TeacherCourseQualification[] = [
    {
      id: "q-1",
      courseId: "c-1",
      instituteId: "inst-1",
      teacherProfileId: "tp-1",
      course: {
        id: "c-1",
        title: "American English File 1 - 1",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "q-2",
      courseId: "c-2",
      instituteId: "inst-1",
      teacherProfileId: "tp-1",
      course: {
        id: "c-2",
        title: "American English File Starter - 1",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "q-3",
      courseId: "c-3",
      instituteId: "inst-1",
      teacherProfileId: "tp-1",
      course: {
        id: "c-3",
        title: "Top Notch 1A - 2",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("renders empty state when there are no teachable courses", () => {
    render(<TeachableCoursesCarousel teachableCourses={[]} />)

    expect(screen.getByText("دوره‌های مجاز برای تدریس")).toBeInTheDocument()
    expect(
      screen.getByText("هنوز دوره‌ای برای تدریس این استاد ثبت نشده است.")
    ).toBeInTheDocument()
  })

  it("renders course cards with full titles and short titles in the carousel", () => {
    render(<TeachableCoursesCarousel teachableCourses={mockQualifications} />)

    expect(screen.getByText("دوره‌های مجاز برای تدریس")).toBeInTheDocument()
    expect(screen.getByText("۳ دوره")).toBeInTheDocument()

    // Full titles
    expect(screen.getByText("American English File 1 - 1")).toBeInTheDocument()
    expect(
      screen.getByText("American English File Starter - 1")
    ).toBeInTheDocument()
    expect(screen.getByText("Top Notch 1A - 2")).toBeInTheDocument()

    // Short titles formatted
    expect(screen.getByText("AEF 1-1")).toBeInTheDocument()
    expect(screen.getByText("AEF Starter-1")).toBeInTheDocument()
    expect(screen.getByText("TN 1A-2")).toBeInTheDocument()

    // Sequence numbers
    expect(screen.getByText("#۱")).toBeInTheDocument()
    expect(screen.getByText("#۲")).toBeInTheDocument()
    expect(screen.getByText("#۳")).toBeInTheDocument()
  })

  it("filters courses when search query is entered and shows reset on no match", () => {
    const manyQualifications: TeacherCourseQualification[] = [
      ...mockQualifications,
      {
        id: "q-4",
        courseId: "c-4",
        instituteId: "inst-1",
        teacherProfileId: "tp-1",
        course: { id: "c-4", title: "American English File 2 - 1" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "q-5",
        courseId: "c-5",
        instituteId: "inst-1",
        teacherProfileId: "tp-1",
        course: { id: "c-5", title: "American English File 3 - 1" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "q-6",
        courseId: "c-6",
        instituteId: "inst-1",
        teacherProfileId: "tp-1",
        course: { id: "c-6", title: "American English File 4 - 1" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    render(<TeachableCoursesCarousel teachableCourses={manyQualifications} />)

    const searchInput = screen.getByPlaceholderText("جستجوی دوره...")
    expect(searchInput).toBeInTheDocument()

    // Filter to "Starter"
    fireEvent.change(searchInput, { target: { value: "Starter" } })
    expect(
      screen.getByText("American English File Starter - 1")
    ).toBeInTheDocument()
    expect(
      screen.queryByText("American English File 1 - 1")
    ).not.toBeInTheDocument()

    // Filter to non-matching query
    fireEvent.change(searchInput, { target: { value: "NonExistingCourse" } })
    expect(
      screen.getByText("دوره‌ای مطابق با جستجو یافت نشد.")
    ).toBeInTheDocument()

    // Clear search button (click the input clear button or empty state reset button)
    const clearButtons = screen.getAllByRole("button", {
      name: "پاک کردن جستجو",
    })
    expect(clearButtons.length).toBeGreaterThan(0)
    fireEvent.click(clearButtons[0]!)
    expect(screen.getByText("American English File 1 - 1")).toBeInTheDocument()
  })
})
