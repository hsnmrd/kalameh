import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { CoursesHeaderActions } from "../index"

describe("CoursesHeaderActions Component", () => {
  it("renders dropdown trigger and triggers callbacks", () => {
    const onImportClick = vi.fn()
    const onExportClick = vi.fn()

    render(
      <CoursesHeaderActions
        totalCount={5}
        onImportClick={onImportClick}
        onExportClick={onExportClick}
      />
    )

    const trigger = screen.getByRole("button", { name: "دوره‌ها" })
    expect(trigger).toBeInTheDocument()

    fireEvent.click(trigger)

    expect(screen.getByText("ورود از اکسل")).toBeInTheDocument()
    expect(screen.getByText("خروجی اکسل")).toBeInTheDocument()

    fireEvent.click(screen.getByText("ورود از اکسل"))
    expect(onImportClick).toHaveBeenCalledTimes(1)
  })

  it("returns null when no actions are provided", () => {
    const { container } = render(<CoursesHeaderActions totalCount={5} />)
    expect(container).toBeEmptyDOMElement()
  })
})
