import { describe, it, expect, vi } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { NoOperatingPhaseAlert } from "../components/no-operating-phase-alert"

describe("NoOperatingPhaseAlert Component", () => {
  it("should render error title and description informing user operating phases are required", () => {
    render(<NoOperatingPhaseAlert />)

    expect(screen.getByText("فاز زمانی تعریف نشده است")).toBeInTheDocument()
    expect(
      screen.getByText(
        "برای مدیریت فراگیران و ثبت زمان‌بندی حضور، ابتدا باید حداقل یک فاز زمانی فعال در آموزشگاه تعریف و تنظیم شود."
      )
    ).toBeInTheDocument()
  })

  it("should render link button directing user to operating phases page", () => {
    render(<NoOperatingPhaseAlert />)

    const link = screen.getByRole("link", { name: /تعریف فاز زمانی/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute("href", "/operating-phases")
  })
})
