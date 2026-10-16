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

      const clearBtn = screen.getByRole("button", {
        name: /پاک کردن جستجو/i,
      })
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
    it("should render search in layout and show filters on clicking filter button", () => {
      render(
        <AdminFilterBar
          search={<div data-testid="search-slot">Search</div>}
          filters={<div data-testid="filter-slot">Filters</div>}
        />
      )

      expect(screen.getByTestId("search-slot")).toBeInTheDocument()
      const filterBtn = screen.getByRole("button", { name: /فیلتر|filter/i })
      expect(filterBtn).toBeInTheDocument()

      fireEvent.click(filterBtn)
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

    it("should open filter dialog on clicking filter button", () => {
      render(
        <AdminFilterBar
          filters={<div data-testid="dialog-filter-content">Options</div>}
        />
      )

      const filterBtn = screen.getByRole("button", {
        name: /فیلتر|filter/i,
      })
      fireEvent.click(filterBtn)

      expect(screen.getByTestId("dialog-filter-content")).toBeInTheDocument()
    })

    it("should call onFilterClick when filter button is clicked and onFilterClick is provided", () => {
      const handleFilterClick = vi.fn()
      render(
        <AdminFilterBar
          onFilterClick={handleFilterClick}
          filterButtonLabel="ویرایش تنظیمات"
        />
      )

      const filterBtn = screen.getByRole("button", {
        name: /ویرایش تنظیمات/i,
      })
      expect(filterBtn).toBeInTheDocument()

      fireEvent.click(filterBtn)
      expect(handleFilterClick).toHaveBeenCalledTimes(1)
    })

    it("should render actions slot when provided", () => {
      render(
        <AdminFilterBar
          search={<div data-testid="search-slot">Search</div>}
          actions={<div data-testid="action-btn">Add Item</div>}
        />
      )

      expect(screen.getByTestId("action-btn")).toBeInTheDocument()
    })

    it("should render AvatarBadge for mobile view and Badge next to icon on desktop when activeFiltersCount > 0", () => {
      const { container } = render(
        <AdminFilterBar
          filters={<div>Filter options</div>}
          activeFiltersCount={3}
        />
      )

      // Mobile AvatarBadge
      const avatarBadge = container.querySelector('[data-slot="avatar-badge"]')
      expect(avatarBadge).toBeInTheDocument()
      expect(avatarBadge?.className).toContain("sm:hidden")
      expect(avatarBadge?.textContent).toMatch(/3|۳/)

      // Desktop inline Badge
      const desktopBadge = container.querySelector(".hidden.sm\\:inline-flex")
      expect(desktopBadge).toBeInTheDocument()
      expect(desktopBadge?.textContent).toMatch(/3|۳/)

      // Check DOM ordering: Sliders icon comes before desktop badge, which comes before label
      const button = screen.getByRole("button", { name: /فیلتر|filter/i })
      const svg = button.querySelector("svg")
      expect(svg).toBeInTheDocument()
      // Badge should be immediately after the mobile avatar badge / adjacent to icon
      expect(button.contains(desktopBadge)).toBe(true)
    })

    it("should not render any count badges when activeFiltersCount is 0", () => {
      const { container } = render(
        <AdminFilterBar
          filters={<div>Filter options</div>}
          activeFiltersCount={0}
        />
      )

      expect(
        container.querySelector('[data-slot="avatar-badge"]')
      ).not.toBeInTheDocument()
      expect(
        container.querySelector(".hidden.sm\\:inline-flex")
      ).not.toBeInTheDocument()
    })

    it("should render filter sheet footer with safe-area padding", () => {
      render(
        <AdminFilterBar filters={<div>Filter options</div>} hasDialog={true} />
      )

      const filterBtn = screen.getByRole("button", { name: /فیلتر|filter/i })
      fireEvent.click(filterBtn)

      const showBtn = screen.getByRole("button", { name: /نمایش|show/i })
      const footer = showBtn.parentElement
      expect(footer).toHaveClass(
        "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
      )
    })

    it("should render custom filterIcon and apply filterButtonClassName when provided", () => {
      render(
        <AdminFilterBar
          filters={<div>Filter options</div>}
          filterIcon={<span data-testid="custom-filter-icon">Custom Icon</span>}
          filterButtonClassName="custom-btn-class"
        />
      )

      expect(screen.getByTestId("custom-filter-icon")).toBeInTheDocument()
      const filterBtn = screen.getByRole("button", { name: /فیلتر|filter/i })
      expect(filterBtn).toHaveClass("custom-btn-class")
    })

    it("should render custom filterDialogFooter when provided", () => {
      render(
        <AdminFilterBar
          filters={<div>Filter options</div>}
          filterDialogFooter={
            <div data-testid="custom-footer">Custom Footer</div>
          }
        />
      )

      const filterBtn = screen.getByRole("button", { name: /فیلتر|filter/i })
      fireEvent.click(filterBtn)

      expect(screen.getByTestId("custom-footer")).toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /نمایش|show/i })
      ).not.toBeInTheDocument()
    })
  })
})
