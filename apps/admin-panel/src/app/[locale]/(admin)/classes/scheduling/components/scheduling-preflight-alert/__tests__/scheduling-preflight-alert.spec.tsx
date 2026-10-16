import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/test-utils"
import { SchedulingPreflightAlert } from "../index"

describe("SchedulingPreflightAlert", () => {
  it("renders null when there are no preflight errors", () => {
    const { container } = render(
      <SchedulingPreflightAlert
        hasNoTeachers={false}
        hasNoTeacherSchedule={false}
        hasNoBranchClassrooms={false}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("renders teacher error alert when there are no teachers", () => {
    render(
      <SchedulingPreflightAlert
        hasNoTeachers={true}
        hasNoTeacherSchedule={false}
        hasNoBranchClassrooms={false}
      />
    )

    expect(screen.getByTestId("preflight-teacher-error")).toBeInTheDocument()
    expect(
      screen.getByText("هیچ استادی در مؤسسه ثبت نشده است.")
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "مدیریت اساتید" })).toHaveAttribute(
      "href",
      "/teachers"
    )
  })

  it("renders teacher schedule error alert when teachers have no schedule", () => {
    render(
      <SchedulingPreflightAlert
        hasNoTeachers={false}
        hasNoTeacherSchedule={true}
        hasNoBranchClassrooms={false}
      />
    )

    expect(screen.getByTestId("preflight-teacher-error")).toBeInTheDocument()
    expect(
      screen.getByText(
        "هیچ‌کدام از اساتید برنامه زمانی آزاد خود را تعیین نکرده‌اند."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "مدیریت اساتید" })).toHaveAttribute(
      "href",
      "/teachers"
    )
  })

  it("renders classroom error alert when selected branch has no classrooms", () => {
    render(
      <SchedulingPreflightAlert
        hasNoTeachers={false}
        hasNoTeacherSchedule={false}
        hasNoBranchClassrooms={true}
      />
    )

    expect(screen.getByTestId("preflight-classroom-error")).toBeInTheDocument()
    expect(
      screen.getByText("هیچ کلاس درسی برای این شعبه تعریف نشده است.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "مدیریت کلاس‌های درس" })
    ).toHaveAttribute("href", "/classrooms")
  })

  it("renders both teacher and classroom errors when both are present", () => {
    render(
      <SchedulingPreflightAlert
        hasNoTeachers={true}
        hasNoTeacherSchedule={false}
        hasNoBranchClassrooms={true}
      />
    )

    expect(screen.getByTestId("preflight-teacher-error")).toBeInTheDocument()
    expect(screen.getByTestId("preflight-classroom-error")).toBeInTheDocument()
  })
})
