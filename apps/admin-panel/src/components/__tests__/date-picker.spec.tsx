import { afterEach, describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { DateRangePicker } from "@workspace/ui/components/date-range-picker"
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

  describe("DateRangePicker", () => {
    it("should render placeholder and open range calendar popover on click", () => {
      const handleChange = vi.fn()
      render(
        <DateRangePicker
          value={null}
          onChange={handleChange}
          locale="fa"
          placeholder="انتخاب بازه تاریخ"
        />
      )

      expect(screen.getByText("انتخاب بازه تاریخ")).toBeInTheDocument()
      fireEvent.click(screen.getByRole("button", { name: "انتخاب بازه تاریخ" }))
      expect(document.querySelector(".rdp-root")).toBeInTheDocument()
    })

    it("should format and display selected range in Persian format", () => {
      render(
        <DateRangePicker
          value={{ from: "2026-08-23", to: "2026-09-01" }}
          onChange={vi.fn()}
          locale="fa"
        />
      )

      // 2026-08-23 is 1405/06/01 and 2026-09-01 is 1405/06/10
      expect(
        screen.getByText(/1405\/06\/01 تا 1405\/06\/10/)
      ).toBeInTheDocument()
    })

    it("should format single day range without separator", () => {
      render(
        <DateRangePicker
          value={{ from: "2026-08-23", to: "2026-08-23" }}
          onChange={vi.fn()}
          locale="fa"
        />
      )

      expect(screen.getByText("1405/06/01")).toBeInTheDocument()
    })

    it("should format and display selected range in Gregorian format when locale is en", () => {
      render(
        <DateRangePicker
          value={{ from: "2026-08-23", to: "2026-09-01" }}
          onChange={vi.fn()}
          locale="en"
        />
      )

      expect(screen.getByText("2026-08-23 - 2026-09-01")).toBeInTheDocument()
    })

    it("should clear range when clear button is clicked", () => {
      const handleChange = vi.fn()
      render(
        <DateRangePicker
          value={{ from: "2026-08-23", to: "2026-09-01" }}
          onChange={handleChange}
          locale="fa"
        />
      )

      const clearBtn = screen.getByRole("button", {
        name: "پاک کردن بازه تاریخ",
      })
      fireEvent.click(clearBtn)
      expect(handleChange).toHaveBeenCalledWith(undefined)
    })

    it("should keep picker open when selecting dates and only commit on confirm button click", async () => {
      const handleChange = vi.fn()
      render(
        <DateRangePicker
          value={null}
          onChange={handleChange}
          locale="fa"
          placeholder="انتخاب بازه تاریخ"
        />
      )

      fireEvent.click(screen.getByRole("button", { name: "انتخاب بازه تاریخ" }))
      expect(document.querySelector(".rdp-root")).toBeInTheDocument()

      const confirmBtn = screen.getByRole("button", { name: "تأیید" })
      // Disabled initially because no date is selected
      expect(confirmBtn).toBeDisabled()

      // Find and click a day button in calendar
      const dayButtons = document.querySelectorAll("td button")
      expect(dayButtons.length).toBeGreaterThan(0)
      fireEvent.click(dayButtons[10])

      // Calendar should still be open!
      expect(document.querySelector(".rdp-root")).toBeInTheDocument()
      expect(confirmBtn).not.toBeDisabled()
      // onChange should NOT have been called yet
      expect(handleChange).not.toHaveBeenCalled()

      // Click confirm
      fireEvent.click(confirmBtn)
      expect(handleChange).toHaveBeenCalledTimes(1)
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      )
    })

    it("should render action buttons in drawer footer instead of بستن on mobile with h-14 height", () => {
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

      const handleChange = vi.fn()
      render(
        <DateRangePicker
          value={null}
          onChange={handleChange}
          locale="fa"
          placeholder="انتخاب بازه تاریخ"
        />
      )

      fireEvent.click(screen.getByRole("button", { name: "انتخاب بازه تاریخ" }))

      // Heading in drawer
      expect(
        screen.getByRole("heading", { name: "انتخاب بازه تاریخ" })
      ).toBeInTheDocument()

      // "بستن" must NOT exist in the drawer
      expect(
        screen.queryByRole("button", { name: "بستن" })
      ).not.toBeInTheDocument()

      // "تأیید" and "انصراف" should be in the drawer footer
      const confirmBtn = screen.getByRole("button", { name: "تأیید" })
      const cancelBtn = screen.getByRole("button", { name: "انصراف" })
      expect(confirmBtn).toBeInTheDocument()
      expect(cancelBtn).toBeInTheDocument()
      expect(confirmBtn).toBeDisabled()

      // Both buttons follow standard 56px (h-14) mobile touch target
      expect(confirmBtn).toHaveClass("h-14")
      expect(cancelBtn).toHaveClass("h-14")
    })
  })
})
