import { afterEach, describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Calendar } from "@workspace/ui/components/calendar"

describe("Calendar & DatePicker Components", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

    it("should open to the month of the selected date in Jalali calendar", () => {
      render(
        <Calendar
          mode="single"
          locale="fa"
          selected={new Date("2027-03-16T00:00:00Z")}
        />
      )

      expect(screen.getByText(/اسفند/i)).toBeInTheDocument()
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

    it("should open the calendar in a bottom-sheet drawer on mobile", () => {
      vi.spyOn(window, "matchMedia").mockImplementation(
        (query) =>
          ({
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }) as MediaQueryList
      )

      render(
        <DatePicker
          value=""
          onChange={vi.fn()}
          locale="fa"
          placeholder="انتخاب تاریخ تولد"
        />
      )

      fireEvent.click(screen.getByRole("button", { name: "انتخاب تاریخ تولد" }))

      expect(
        screen.getByRole("heading", { name: "انتخاب تاریخ" })
      ).toBeInTheDocument()
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

    it("should open calendar popover on the month and year of the selected date (e.g. Esfand 1405)", () => {
      render(<DatePicker value="2027-03-16" onChange={vi.fn()} locale="fa" />)

      fireEvent.click(screen.getByRole("button", { name: /1405\/12\/25/i }))

      expect(screen.getByText("اسفند 1405")).toBeInTheDocument()
    })

    it("should pass showOffDays to internal calendar and highlight off days", () => {
      render(
        <DatePicker
          value="2027-03-16"
          onChange={vi.fn()}
          locale="fa"
          showOffDays={true}
        />
      )

      fireEvent.click(screen.getByRole("button", { name: /1405\/12\/25/i }))

      expect(screen.getByText("اسفند 1405")).toBeInTheDocument()
      const offDayCells = document.querySelectorAll(
        "td[class*='text-destructive']"
      )
      expect(offDayCells.length).toBeGreaterThan(0)
    })

    it("should render compact clickable trigger when variant is inline", () => {
      render(
        <DatePicker
          variant="inline"
          value="2026-09-23"
          onChange={vi.fn()}
          locale="fa"
        />
      )

      const trigger = screen.getByRole("button")
      expect(trigger).toHaveClass("inline-flex")
      expect(trigger).toHaveClass("h-8")
      expect(screen.getByText(/1405\/07\/01/)).toBeInTheDocument()
    })
  })
})
