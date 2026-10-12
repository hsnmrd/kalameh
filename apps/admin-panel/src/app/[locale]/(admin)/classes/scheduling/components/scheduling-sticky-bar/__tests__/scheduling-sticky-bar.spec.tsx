import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/test-utils"
import { SchedulingStickyBar } from "../index"

describe("SchedulingStickyBar", () => {
  it("renders the sticky submit button with label and icon", () => {
    const handleGenerate = vi.fn()
    render(<SchedulingStickyBar onGenerateSchedule={handleGenerate} />)

    const button = screen.getByRole("button", { name: "ثبت و ادامه" })
    expect(button).toBeInTheDocument()
    expect(button).toBeEnabled()

    fireEvent.click(button)
    expect(handleGenerate).toHaveBeenCalledTimes(1)
  })

  it("disables the button when disabled prop is true", () => {
    render(<SchedulingStickyBar onGenerateSchedule={vi.fn()} disabled={true} />)

    const button = screen.getByRole("button", { name: "ثبت و ادامه" })
    expect(button).toBeDisabled()
  })

  it("shows spinner and disables button when isGenerating is true", () => {
    render(
      <SchedulingStickyBar onGenerateSchedule={vi.fn()} isGenerating={true} />
    )

    const button = screen.getByRole("button", { name: /ثبت و ادامه/ })
    expect(button).toBeDisabled()
  })

  it("returns null when onGenerateSchedule is not provided", () => {
    const { container } = render(<SchedulingStickyBar />)
    expect(container.firstChild).toBeNull()
  })
})
