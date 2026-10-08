import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ModalSuspenseFallback } from "../index"

describe("ModalSuspenseFallback Component", () => {
  it("renders status loading indicator with accessible label", () => {
    render(<ModalSuspenseFallback />)

    const spinner = screen.getByRole("status")
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute("aria-label", "بارگذاری")
  })
})
