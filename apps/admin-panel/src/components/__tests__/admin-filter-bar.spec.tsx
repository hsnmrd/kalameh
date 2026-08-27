import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { AdminFilterBar } from "../admin-filter-bar"
import { AdminSearchInput } from "../admin-search-input"
import { AdminFilterTabs } from "../admin-filter-tabs"

describe("Admin Filter System Components", () => {
  describe("AdminSearchInput", () => {
    it("should render input with placeholder and emit change events", () => {
      const handleChange = vi.fn()
      render(
        <AdminSearchInput
          value=""
          onChange={handleChange}
          placeholder="جستجو بر اساس نام..."
        />
      )

      const input = screen.getByPlaceholderText("جستجو بر اساس نام...")
      expect(input).toBeInTheDocument()

      fireEvent.change(input, { target: { value: "علی" } })
      expect(handleChange).toHaveBeenCalledWith("علی")
    })

    it("should render clear button when value exists and clear value on click", () => {
      const handleChange = vi.fn()
      render(
        <AdminSearchInput
          value="علی"
          onChange={handleChange}
          placeholder="جستجو..."
        />
      )

      const clearBtn = screen.getByRole("button", { name: /clear search/i })
      expect(clearBtn).toBeInTheDocument()
      fireEvent.click(clearBtn)
      expect(handleChange).toHaveBeenCalledWith("")
    })
  })

  describe("AdminFilterTabs", () => {
    it("should render tabs and trigger onChange with clicked tab key", () => {
      const handleChange = vi.fn()
      const options = [
        { key: "ALL", label: "همه", count: 20 },
        { key: "ACTIVE", label: "فعال", count: 15 },
        { key: "INACTIVE", label: "غیرفعال", count: 5 },
      ]

      render(
        <AdminFilterTabs
          options={options}
          value="ALL"
          onChange={handleChange}
        />
      )

      expect(screen.getByText("همه")).toBeInTheDocument()
      expect(screen.getByText("فعال")).toBeInTheDocument()
      expect(screen.getByText("غیرفعال")).toBeInTheDocument()

      fireEvent.click(screen.getByText("فعال"))
      expect(handleChange).toHaveBeenCalledWith("ACTIVE")
    })
  })

  describe("AdminFilterBar", () => {
    it("should render search and filters in layout", () => {
      render(
        <AdminFilterBar
          search={<div data-testid="search-slot">Search</div>}
          filters={<div data-testid="filter-slot">Filters</div>}
        />
      )

      expect(screen.getByTestId("search-slot")).toBeInTheDocument()
      expect(screen.getByTestId("filter-slot")).toBeInTheDocument()
    })

    it("should apply pinned revealed classes when isPinned is true", () => {
      const { container } = render(
        <AdminFilterBar
          isPinned={true}
          search={<div data-testid="search-slot">Search</div>}
        />
      )

      const wrapper = container.querySelector(".grid-rows-\\[1fr\\]")
      expect(wrapper).toBeInTheDocument()
    })

    it("should open mobile filter drawer on clicking filter button", () => {
      render(
        <AdminFilterBar
          filters={<div data-testid="drawer-filter-content">Options</div>}
        />
      )

      const filterBtn = screen.getByRole("button", {
        name: /فیلتر|filter/i,
      })
      expect(filterBtn).toBeInTheDocument()
      expect(screen.getAllByTestId("drawer-filter-content")).toHaveLength(1)

      fireEvent.click(filterBtn)

      expect(screen.getAllByTestId("drawer-filter-content")).toHaveLength(2)
    })
  })
})
