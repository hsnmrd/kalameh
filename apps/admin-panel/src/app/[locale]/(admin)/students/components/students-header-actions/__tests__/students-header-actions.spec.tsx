import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { StudentsHeaderActions } from "../index"

describe("StudentsHeaderActions Component", () => {
  it("renders dropdown trigger with only common messages and triggers callbacks", () => {
    const onImportClick = vi.fn()
    const onExportClick = vi.fn()
    const onConfirmScheduleClick = vi.fn()

    render(
      <StudentsHeaderActions
        totalCount={5}
        onImportClick={onImportClick}
        onExportClick={onExportClick}
        onConfirmScheduleClick={onConfirmScheduleClick}
        confirmScheduleLabel="تأیید برنامه زمانی فراگیران"
      />
    )

    const trigger = screen.getByRole("button", { name: "زبان‌آموزان" })
    expect(trigger).toBeInTheDocument()

    fireEvent.click(trigger)

    expect(screen.getByText("ورود از اکسل")).toBeInTheDocument()
    expect(screen.getByText("خروجی اکسل")).toBeInTheDocument()
    expect(screen.getByText("تأیید برنامه زمانی فراگیران")).toBeInTheDocument()

    fireEvent.click(screen.getByText("تأیید برنامه زمانی فراگیران"))
    expect(onConfirmScheduleClick).toHaveBeenCalledTimes(1)
  })

  it("falls back to common.json trigger label if confirmScheduleLabel is not provided", () => {
    render(
      <StudentsHeaderActions totalCount={5} onConfirmScheduleClick={vi.fn()} />
    )

    const trigger = screen.getByRole("button", { name: "زبان‌آموزان" })
    fireEvent.click(trigger)

    expect(screen.getByText("تأیید برنامه زمانی فراگیران")).toBeInTheDocument()
  })

  it("returns null when no actions are provided", () => {
    const { container } = render(<StudentsHeaderActions totalCount={5} />)
    expect(container).toBeEmptyDOMElement()
  })
})
