import * as React from "react"
import { afterEach, describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, within } from "../../test/test-utils"
import {
  TimePicker,
  TimeWheelPicker,
  WheelColumn,
  parseTimeString,
  formatTimeString,
  toPersianDigits,
  toLatinDigits,
} from "@workspace/ui/components/time-picker"

describe("TimePicker & WheelPicker Components", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Utility Helpers", () => {
    it("should parse standard time strings accurately", () => {
      expect(parseTimeString("14:30")).toEqual({ hour: 14, minute: 30 })
      expect(parseTimeString("08:05")).toEqual({ hour: 8, minute: 5 })
      expect(parseTimeString("23:59")).toEqual({ hour: 23, minute: 59 })
      expect(parseTimeString("00:00")).toEqual({ hour: 0, minute: 0 })
      expect(parseTimeString("invalid")).toBeNull()
      expect(parseTimeString("")).toBeNull()
      expect(parseTimeString(null)).toBeNull()
      expect(parseTimeString(undefined)).toBeNull()
    })

    it("should parse Persian digit time strings", () => {
      expect(parseTimeString("۱۴:۳۰")).toEqual({ hour: 14, minute: 30 })
      expect(parseTimeString("۰۸:۰۵")).toEqual({ hour: 8, minute: 5 })
    })

    it("should format time to standard HH:mm string", () => {
      expect(formatTimeString(8, 5)).toBe("08:05")
      expect(formatTimeString(14, 30)).toBe("14:30")
      expect(formatTimeString(0, 0)).toBe("00:00")
    })

    it("should convert digits between Persian and Latin correctly", () => {
      expect(toPersianDigits("14:30")).toBe("۱۴:۳۰")
      expect(toLatinDigits("۱۴:۳۰")).toBe("14:30")
    })
  })

  describe("TimePicker Component", () => {
    it("should render placeholder when no value is provided", () => {
      render(<TimePicker placeholder="انتخاب زمان..." locale="fa" />)
      expect(screen.getByText("انتخاب زمان...")).toBeInTheDocument()
    })

    it("should render formatted time in Persian digits when locale is fa", () => {
      render(<TimePicker value="14:30" locale="fa" />)
      expect(screen.getByText("۱۴:۳۰")).toBeInTheDocument()
    })

    it("should render formatted time in Latin digits when locale is en", () => {
      render(<TimePicker value="14:30" locale="en" />)
      expect(screen.getByText("14:30")).toBeInTheDocument()
    })

    it("should not render close or clear icon inside time picker", () => {
      render(<TimePicker value="14:30" locale="fa" />)

      expect(
        screen.queryByRole("button", { name: /پاک کردن زمان/i })
      ).not.toBeInTheDocument()
    })

    it("should render inline variant with compact size", () => {
      render(<TimePicker value="10:00" variant="inline" locale="fa" />)
      expect(screen.getByText("۱۰:۰۰")).toBeInTheDocument()
    })

    it("should not render confirm or now buttons when closed", () => {
      render(<TimePicker value="14:30" locale="fa" />)
      expect(
        screen.queryByRole("button", { name: "اکنون" })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: "تأیید" })
      ).not.toBeInTheDocument()
    })

    it("should render exactly one set of confirm and now buttons when open (no duplicate rows)", () => {
      render(<TimePicker value="14:30" locale="fa" />)
      const trigger = screen.getByRole("button", { name: /۱۴:۳۰/i })
      fireEvent.click(trigger)
      expect(screen.getAllByRole("button", { name: "اکنون" })).toHaveLength(1)
      expect(screen.getAllByRole("button", { name: "تأیید" })).toHaveLength(1)
    })

    it("should update time and close when confirm is clicked", () => {
      const handleChange = vi.fn()
      render(<TimePicker value="14:30" onChange={handleChange} locale="fa" />)
      const trigger = screen.getByRole("button", { name: /۱۴:۳۰/i })
      fireEvent.click(trigger)

      const confirmBtn = screen.getByRole("button", { name: "تأیید" })
      fireEvent.click(confirmBtn)
      expect(handleChange).toHaveBeenCalledWith("14:30")
    })
  })

  describe("TimeWheelPicker Component", () => {
    it("should render hour and minute columns with colon separator", () => {
      render(<TimeWheelPicker value="14:30" locale="en" />)
      const hourListbox = screen.getByRole("listbox", { name: "Select hour" })
      const minuteListbox = screen.getByRole("listbox", {
        name: "Select minute",
      })
      expect(within(hourListbox).getByText("14")).toBeInTheDocument()
      expect(within(minuteListbox).getByText("30")).toBeInTheDocument()
      expect(screen.getByText(":")).toBeInTheDocument()
    })

    it("should render Persian digits when locale is fa", () => {
      render(<TimeWheelPicker value="14:30" locale="fa" />)
      const hourListbox = screen.getByRole("listbox", { name: "انتخاب ساعت" })
      const minuteListbox = screen.getByRole("listbox", {
        name: "انتخاب دقیقه",
      })
      expect(within(hourListbox).getByText("۱۴")).toBeInTheDocument()
      expect(within(minuteListbox).getByText("۳۰")).toBeInTheDocument()
    })

    it("should call onChange with updated time when an hour is selected", () => {
      const handleChange = vi.fn()
      render(
        <TimeWheelPicker value="14:30" onChange={handleChange} locale="en" />
      )

      const hourListbox = screen.getByRole("listbox", { name: "Select hour" })
      const hour16Btn = within(hourListbox).getByRole("button", { name: "16" })
      fireEvent.click(hour16Btn)

      expect(handleChange).toHaveBeenCalledWith("16:30")
    })

    it("should call onChange with updated time when a minute is selected", () => {
      const handleChange = vi.fn()
      render(
        <TimeWheelPicker value="14:30" onChange={handleChange} locale="en" />
      )

      const minuteListbox = screen.getByRole("listbox", {
        name: "Select minute",
      })
      const min45Btn = within(minuteListbox).getByRole("button", { name: "45" })
      fireEvent.click(min45Btn)

      expect(handleChange).toHaveBeenCalledWith("14:45")
    })

    it("should support custom minute steps", () => {
      render(<TimeWheelPicker value="14:00" minuteStep={15} locale="en" />)
      const minuteListbox = screen.getByRole("listbox", {
        name: "Select minute",
      })
      expect(
        within(minuteListbox).getByRole("button", { name: "00" })
      ).toBeInTheDocument()
      expect(
        within(minuteListbox).getByRole("button", { name: "15" })
      ).toBeInTheDocument()
      expect(
        within(minuteListbox).getByRole("button", { name: "30" })
      ).toBeInTheDocument()
      expect(
        within(minuteListbox).getByRole("button", { name: "45" })
      ).toBeInTheDocument()
      expect(
        within(minuteListbox).queryByRole("button", { name: "10" })
      ).not.toBeInTheDocument()
    })
  })

  describe("WheelColumn Component", () => {
    it("should render listbox with all items", () => {
      const items = [
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta" },
        { value: "c", label: "Gamma" },
      ]
      render(
        <WheelColumn
          items={items}
          value="b"
          onChange={vi.fn()}
          ariaLabel="Test column"
        />
      )

      expect(
        screen.getByRole("listbox", { name: "Test column" })
      ).toBeInTheDocument()
      expect(screen.getByText("Alpha")).toBeInTheDocument()
      expect(screen.getByText("Beta")).toBeInTheDocument()
      expect(screen.getByText("Gamma")).toBeInTheDocument()
    })

    it("should handle keyboard navigation", () => {
      const handleChange = vi.fn()
      const items = [
        { value: 0, label: "Zero" },
        { value: 1, label: "One" },
        { value: 2, label: "Two" },
      ]

      function ControlledColumn() {
        const [val, setVal] = React.useState(0)
        return (
          <WheelColumn
            items={items}
            value={val}
            onChange={(next) => {
              handleChange(next)
              setVal(next)
            }}
            ariaLabel="Number column"
          />
        )
      }

      render(<ControlledColumn />)

      const listbox = screen.getByRole("listbox", { name: "Number column" })
      fireEvent.keyDown(listbox, { key: "ArrowDown" })
      expect(handleChange).toHaveBeenCalledWith(1)

      fireEvent.keyDown(listbox, { key: "ArrowUp" })
      expect(handleChange).toHaveBeenCalledWith(0)
    })
  })
})
