import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { MonthsSelector } from "../components/months-selector"

describe("MonthsSelector Component", () => {
  it("renders all 12 Jalali months", () => {
    render(<MonthsSelector value={[]} onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: /فروردین/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /اسفند/i })).toBeInTheDocument()
  })

  it("applies error styling and aria-invalid to all buttons when hasError is true", () => {
    render(<MonthsSelector value={[]} onChange={vi.fn()} hasError={true} />)

    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBe(12)

    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute("aria-invalid", "true")
      expect(btn.className).toContain("text-destructive")
      expect(btn.className).toContain("border-destructive")
    })
  })

  it("does not apply error styling when hasError is false", () => {
    render(<MonthsSelector value={[]} onChange={vi.fn()} hasError={false} />)

    const buttons = screen.getAllByRole("button")
    buttons.forEach((btn) => {
      expect(btn).not.toHaveAttribute("aria-invalid")
      expect(btn.className).not.toContain("text-destructive")
    })
  })

  it("does not apply error styling when value has selected months even if hasError is true", () => {
    render(<MonthsSelector value={[7]} onChange={vi.fn()} hasError={true} />)

    const buttons = screen.getAllByRole("button")
    buttons.forEach((btn) => {
      expect(btn).not.toHaveAttribute("aria-invalid")
      expect(btn.className).not.toContain("text-destructive")
    })
  })

  it("calls onChange when a month button is clicked", () => {
    const handleChange = vi.fn()
    render(<MonthsSelector value={[7]} onChange={handleChange} />)

    const mehrBtn = screen.getByRole("button", { name: /مهر/i })
    expect(mehrBtn.className).toContain("bg-primary")

    const abanBtn = screen.getByRole("button", { name: /آبان/i })
    fireEvent.click(abanBtn)

    expect(handleChange).toHaveBeenCalledWith([7, 8])
  })
})
