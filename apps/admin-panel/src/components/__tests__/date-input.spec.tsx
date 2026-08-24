import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { DateInput } from "@workspace/ui/components/date-input"

describe("DateInput Component", () => {
  it("should render 3 segment inputs for year, month, and day", () => {
    render(
      <DateInput
        value=""
        onChange={vi.fn()}
        locale="fa"
        placeholderYear="۱۳۸۰"
        placeholderMonth="ماه"
        placeholderDay="روز"
      />
    )

    expect(screen.getByPlaceholderText("۱۳۸۰")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("ماه")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("روز")).toBeInTheDocument()
  })

  it("should populate segments with Jalali date when value is provided in fa locale", () => {
    // 2003-08-05 is 1382-05-14 in Jalali
    render(<DateInput value="2003-08-05" onChange={vi.fn()} locale="fa" />)

    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[]
    expect(inputs[0]?.value).toBe("1382")
    expect(inputs[1]?.value).toBe("05")
    expect(inputs[2]?.value).toBe("14")
  })

  it("should emit ISO date string when all three segments are entered", () => {
    const handleChange = vi.fn()
    render(<DateInput value="" onChange={handleChange} locale="fa" />)

    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[]
    const yearInput = inputs[0]!
    const monthInput = inputs[1]!
    const dayInput = inputs[2]!

    fireEvent.change(yearInput, { target: { value: "1382" } })
    fireEvent.change(monthInput, { target: { value: "05" } })
    fireEvent.change(dayInput, { target: { value: "14" } })

    expect(handleChange).toHaveBeenCalledWith("2003-08-05")
  })

  it("should convert Persian digits entered by user to Latin numbers and calculate ISO date", () => {
    const handleChange = vi.fn()
    render(<DateInput value="" onChange={handleChange} locale="fa" />)

    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[]
    const yearInput = inputs[0]!
    const monthInput = inputs[1]!
    const dayInput = inputs[2]!

    fireEvent.change(yearInput, { target: { value: "۱۳۸۲" } })
    fireEvent.change(monthInput, { target: { value: "۰۵" } })
    fireEvent.change(dayInput, { target: { value: "۱۴" } })

    expect(handleChange).toHaveBeenCalledWith("2003-08-05")
  })

  it("should support paste event with full date string", () => {
    const handleChange = vi.fn()
    render(<DateInput value="" onChange={handleChange} locale="fa" />)

    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[]
    const yearInput = inputs[0]!

    fireEvent.paste(yearInput, {
      clipboardData: {
        getData: () => "1382/05/14",
      },
    })

    expect(handleChange).toHaveBeenCalledWith("2003-08-05")
  })
})
