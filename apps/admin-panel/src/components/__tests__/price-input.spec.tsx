import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import {
  PriceInput,
  formatPriceDisplay,
  parsePriceNumber,
  sanitizeNumericString,
} from "@workspace/ui/components/price-input"

describe("PriceInput Utilities", () => {
  it("should sanitize Persian, Arabic, and formatted strings to ASCII digits", () => {
    expect(sanitizeNumericString("1,500,000")).toBe("1500000")
    expect(sanitizeNumericString("۱,۵۰۰,۰۰۰")).toBe("1500000")
    expect(sanitizeNumericString("١,٥٠٠,٠٠٠")).toBe("1500000")
    expect(sanitizeNumericString("abc 123 xyz")).toBe("123")
    expect(sanitizeNumericString("")).toBe("")
    expect(sanitizeNumericString(null)).toBe("")
  })

  it("should format numbers with 3-by-3 comma separators from the right", () => {
    expect(formatPriceDisplay(1500000)).toBe("1,500,000")
    expect(formatPriceDisplay("1500000")).toBe("1,500,000")
    expect(formatPriceDisplay("۱۵۰۰۰۰۰")).toBe("1,500,000")
    expect(formatPriceDisplay(100)).toBe("100")
    expect(formatPriceDisplay(1000)).toBe("1,000")
    expect(formatPriceDisplay("")).toBe("")
    expect(formatPriceDisplay(null)).toBe("")
  })

  it("should parse numeric strings to valid numbers or null", () => {
    expect(parsePriceNumber("1,500,000")).toBe(1500000)
    expect(parsePriceNumber("۱,۵۰۰,۰۰۰")).toBe(1500000)
    expect(parsePriceNumber("")).toBeNull()
    expect(parsePriceNumber(null)).toBeNull()
  })
})

describe("PriceInput Component", () => {
  it("should format defaultValue with 3-by-3 comma grouping", () => {
    render(<PriceInput defaultValue={1500000} placeholder="Price" />)

    const input = screen.getByPlaceholderText("Price") as HTMLInputElement
    expect(input.value).toBe("1,500,000")
  })

  it("should render تومان unit at the end of input by default in fa locale", () => {
    render(<PriceInput defaultValue={500000} locale="fa" placeholder="Price" />)

    const unit = screen.getByText("تومان")
    expect(unit).toBeInTheDocument()
    expect(unit).toHaveClass("end-4")
  })

  it("should render Toman unit at the end of input in en locale", () => {
    render(<PriceInput defaultValue={500000} locale="en" placeholder="Price" />)

    const unit = screen.getByText("Toman")
    expect(unit).toBeInTheDocument()
    expect(unit).toHaveClass("end-4")
  })

  it("should format entered input with commas as user types and trigger onValueChange", () => {
    const handleValueChange = vi.fn()
    render(
      <PriceInput placeholder="Enter price" onValueChange={handleValueChange} />
    )

    const input = screen.getByPlaceholderText("Enter price") as HTMLInputElement
    fireEvent.change(input, { target: { value: "2500000" } })

    expect(input.value).toBe("2,500,000")
    expect(handleValueChange).toHaveBeenCalledWith(2500000)
  })

  it("should convert Persian digits entered by user to formatted English digits", () => {
    const handleValueChange = vi.fn()
    render(
      <PriceInput placeholder="Enter price" onValueChange={handleValueChange} />
    )

    const input = screen.getByPlaceholderText("Enter price") as HTMLInputElement
    fireEvent.change(input, { target: { value: "۳۵۰۰۰۰۰" } })

    expect(input.value).toBe("3,500,000")
    expect(handleValueChange).toHaveBeenCalledWith(3500000)
  })

  it("should update display when controlled value prop changes", () => {
    const { rerender } = render(
      <PriceInput value={100000} placeholder="Price" />
    )

    const input = screen.getByPlaceholderText("Price") as HTMLInputElement
    expect(input.value).toBe("100,000")

    rerender(<PriceInput value={2000000} placeholder="Price" />)
    expect(input.value).toBe("2,000,000")
  })

  it("should forward ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<PriceInput ref={ref} placeholder="Ref price" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.placeholder).toBe("Ref price")
  })
})
