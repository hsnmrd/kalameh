import { describe, expect, it, vi } from "vitest"
import type { CourseDto } from "@workspace/types"
import { fireEvent, render, screen } from "../../../../../test/test-utils"
import { CourseQualificationsEditor } from "../components/course-qualifications-editor"

describe("CourseQualificationsEditor", () => {
  const courses: CourseDto[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      instituteId: "22222222-2222-4222-8222-222222222222",
      title: "Starter A1",
      baseFee: 1000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      instituteId: "22222222-2222-4222-8222-222222222222",
      title: "Elementary A2",
      baseFee: 1000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  it("adds and removes a selected teachable course", async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <CourseQualificationsEditor
        courses={courses}
        value={[]}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /انتخاب سطح/ }))
    fireEvent.click(await screen.findByRole("checkbox", { name: "Starter A1" }))
    expect(onChange).toHaveBeenLastCalledWith([courses[0]!.id])

    rerender(
      <CourseQualificationsEditor
        courses={courses}
        value={[courses[0]!.id]}
        onChange={onChange}
      />
    )
    fireEvent.click(await screen.findByRole("checkbox", { name: "Starter A1" }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it("filters available courses by title", async () => {
    render(
      <CourseQualificationsEditor
        courses={courses}
        value={[]}
        onChange={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /انتخاب سطح/ }))
    fireEvent.change(await screen.findByPlaceholderText("جستجوی سطح..."), {
      target: { value: "Elementary" },
    })

    expect(
      screen.getByRole("checkbox", { name: "Elementary A2" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("checkbox", { name: "Starter A1" })
    ).not.toBeInTheDocument()
  })
})
