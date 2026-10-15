import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { NamingFormatCollapsible } from "../index"

describe("NamingFormatCollapsible", () => {
  it("renders collapsed by default with current format badge", () => {
    render(
      <NamingFormatCollapsible namingFormat="PART" onFormatChange={vi.fn()} />
    )
    expect(screen.getByText("فرمت نام‌گذاری دوره‌ها")).toBeInTheDocument()
    expect(screen.getByText("Part")).toBeInTheDocument()
  })

  it("calls onFormatChange when format button is clicked", () => {
    const handleFormatChange = vi.fn()
    render(
      <NamingFormatCollapsible
        namingFormat="PART"
        onFormatChange={handleFormatChange}
      />
    )

    // Expand
    fireEvent.click(
      screen.getByRole("button", { name: /فرمت نام‌گذاری دوره‌ها/i })
    )

    // Click Term button
    const termButton = screen.getByRole("button", { name: "Term" })
    fireEvent.click(termButton)

    expect(handleFormatChange).toHaveBeenCalledWith("TERM")
  })
})
