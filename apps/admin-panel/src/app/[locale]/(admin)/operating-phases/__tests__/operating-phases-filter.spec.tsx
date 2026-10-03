import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { OperatingPhasesFilter } from "../components/operating-phases-filter"

describe("OperatingPhasesFilter", () => {
  it("renders search input with placeholder and calls onSearchChange", () => {
    const handleSearchChange = vi.fn()
    const handleStatusChange = vi.fn()

    render(
      <OperatingPhasesFilter
        search=""
        onSearchChange={handleSearchChange}
        selectedStatus="ALL"
        onStatusChange={handleStatusChange}
      />
    )

    const searchInput = screen.getByPlaceholderText(
      /جستجو بر اساس عنوان فاز زمانی|Search by phase title/i
    )
    expect(searchInput).toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: "تابستان" } })
    expect(handleSearchChange).toHaveBeenCalledWith("تابستان")
  })

  it("renders desktop add phase button and triggers onAddClick", () => {
    const handleAddClick = vi.fn()

    render(
      <OperatingPhasesFilter
        search=""
        onSearchChange={vi.fn()}
        selectedStatus="ALL"
        onStatusChange={vi.fn()}
        onAddClick={handleAddClick}
      />
    )

    const addButton = screen.getByRole("button", {
      name: /افزودن فاز زمانی|Add Operating Phase/i,
    })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)
    expect(handleAddClick).toHaveBeenCalledTimes(1)
  })

  it("renders filter trigger button and opens filter dialog with status options", () => {
    render(
      <OperatingPhasesFilter
        search=""
        onSearchChange={vi.fn()}
        selectedStatus="ALL"
        onStatusChange={vi.fn()}
      />
    )

    const filterButton = screen.getByRole("button", {
      name: /فیلتر|filter/i,
    })
    expect(filterButton).toBeInTheDocument()

    fireEvent.click(filterButton)
    expect(screen.getByText(/وضعیت اجرا|Running Status/i)).toBeInTheDocument()
  })
})
