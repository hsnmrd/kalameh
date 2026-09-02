import * as React from "react"
import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { PasswordInput } from "@workspace/ui/components/password-input"

describe("PasswordInput Component", () => {
  it("should render password input with type password by default", () => {
    render(<PasswordInput placeholder="Enter password" />)

    const input = screen.getByPlaceholderText(
      "Enter password"
    ) as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe("password")

    const toggleButton = screen.getByRole("button", { name: /show password/i })
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveClass("end-3")
  })

  it("should toggle between password and text types when clicking eye button", () => {
    render(<PasswordInput placeholder="Enter password" />)

    const input = screen.getByPlaceholderText(
      "Enter password"
    ) as HTMLInputElement
    const showButton = screen.getByRole("button", { name: /show password/i })

    // Initially password
    expect(input.type).toBe("password")

    // Click to show password
    fireEvent.click(showButton)
    expect(input.type).toBe("text")

    // Click to hide password
    const hideButton = screen.getByRole("button", { name: /hide password/i })
    fireEvent.click(hideButton)
    expect(input.type).toBe("password")
  })

  it("should support rtl mode and propagate dir to wrapper and input", () => {
    const { container } = render(
      <PasswordInput dir="rtl" placeholder="رمز عبور" />
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toHaveAttribute("dir", "rtl")

    const input = screen.getByPlaceholderText("رمز عبور") as HTMLInputElement
    expect(input).toHaveAttribute("dir", "rtl")
    expect(input).toHaveClass("ps-4", "pe-12")

    const toggleButton = screen.getByRole("button", { name: /show password/i })
    // In RTL, end-3 aligns to the end of the input (left)
    expect(toggleButton).toHaveClass("absolute", "end-3")
  })

  it("should support ltr mode and propagate dir to wrapper and input", () => {
    const { container } = render(
      <PasswordInput dir="ltr" placeholder="Password" />
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toHaveAttribute("dir", "ltr")

    const input = screen.getByPlaceholderText("Password") as HTMLInputElement
    expect(input).toHaveAttribute("dir", "ltr")
    expect(input).toHaveClass("ps-4", "pe-12")

    const toggleButton = screen.getByRole("button", { name: /show password/i })
    // In LTR, end-3 aligns to the end of the input (right)
    expect(toggleButton).toHaveClass("absolute", "end-3")
  })

  it("should forward ref to the input element", () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<PasswordInput ref={ref} placeholder="With ref" />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current?.placeholder).toBe("With ref")
  })
})
