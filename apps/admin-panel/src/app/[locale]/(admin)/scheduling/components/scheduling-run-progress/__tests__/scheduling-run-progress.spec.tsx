import { describe, expect, it } from "vitest"
import { render, screen } from "../../../../../../../test/test-utils"
import { SchedulingRunProgress } from "../index"

describe("SchedulingRunProgress Component", () => {
  it("renders 5 calculation stages and progress bar", () => {
    render(<SchedulingRunProgress status="GENERATING" />)

    expect(
      screen.getByRole("region", { name: "مراحل تولید زمان‌بندی" })
    ).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
    expect(
      screen.getByText("بررسی اولیه و کنترل پیش‌نیازها")
    ).toBeInTheDocument()
    expect(
      screen.getByText("تحلیل بازه‌های زمانی اساتید و ظرفیت کلاس‌ها")
    ).toBeInTheDocument()
    expect(
      screen.getByText("ارزیابی اولویت‌ها و شیفت‌های زبان‌آموزان")
    ).toBeInTheDocument()
    expect(
      screen.getByText("تولید و رتبه‌بندی برنامه‌های جایگزین")
    ).toBeInTheDocument()
    expect(screen.getByText("ثبت و نهایی‌سازی پیشنهادها")).toBeInTheDocument()
  })

  it("shows 100% when status is COMPLETED", () => {
    render(<SchedulingRunProgress status="COMPLETED" />)

    expect(screen.getByText("۱۰۰٪")).toBeInTheDocument()
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100"
    )
  })
})
