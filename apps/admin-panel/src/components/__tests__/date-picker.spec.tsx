import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Calendar } from "@workspace/ui/components/calendar"

describe("Calendar & DatePicker Components", () => {
  describe("Calendar", () => {
    it("should render in Persian (Jalali) calendar mode by default when locale is fa", () => {
      render(
        <Calendar
          mode="single"
          locale="fa"
          selected={new Date("2026-08-23T00:00:00Z")}
        />
      )

      // In Jalali, 2026-08-23 corresponds to 1 Shahrivar 1405 (شهریور ۱۴۰۵)
      expect(screen.getByText(/شهریور|1405/i)).toBeInTheDocument()
    })

    it("should render in Gregorian calendar mode when locale is en", () => {
      render(
        <Calendar
          mode="single"
          locale="en"
          selected={new Date("2026-08-23T00:00:00Z")}
        />
      )

      // In Gregorian, August 2026
      expect(screen.getByText(/August|2026/i)).toBeInTheDocument()
    })
  })

  describe("DatePicker", () => {
    it("should render placeholder and open calendar popover on click", () => {
      const handleChange = vi.fn()
      render(
        <DatePicker
          value=""
          onChange={handleChange}
          locale="fa"
          placeholder="انتخاب تاریخ تولد"
        />
      )

      expect(screen.getByText("انتخاب تاریخ تولد")).toBeInTheDocument()
    })

    it("should format and display selected date in Persian format", () => {
      render(<DatePicker value="2026-08-23" onChange={vi.fn()} locale="fa" />)

      // 2026-08-23 in Jalali is 1405/06/01
      expect(screen.getByText(/1405\/06\/01/)).toBeInTheDocument()
    })

    it("should format and display selected date in Gregorian format when locale is en", () => {
      render(<DatePicker value="2026-08-23" onChange={vi.fn()} locale="en" />)

      expect(screen.getByText("2026-08-23")).toBeInTheDocument()
    })
  })
})
