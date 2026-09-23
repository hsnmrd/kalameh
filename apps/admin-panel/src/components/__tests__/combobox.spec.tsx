import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { Combobox, ResponsiveCombobox } from "@workspace/ui/components/combobox"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"

describe("Combobox Component", () => {
  const statusOptions = [
    { value: "ALL", label: "همه وضعیت‌ها" },
    { value: "ACTIVE", label: "فقط ترم‌های فعال" },
    { value: "INACTIVE", label: "فقط ترم‌های بسته شده" },
  ]

  it("should show all options in popup even after selecting an option", async () => {
    const handleValueChange = vi.fn()

    const { rerender } = render(
      <Combobox
        items={statusOptions}
        value="INACTIVE"
        onValueChange={handleValueChange}
        placeholder="انتخاب وضعیت"
      />
    )

    // Open popup
    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveTextContent("فقط ترم‌های بسته شده")

    fireEvent.click(trigger)

    // Verify all 3 options are rendered in the popup
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent("همه وضعیت‌ها")
    expect(options[1]).toHaveTextContent("فقط ترم‌های فعال")
    expect(options[2]).toHaveTextContent("فقط ترم‌های بسته شده")

    // Click another option
    fireEvent.click(options[1]!)
    expect(handleValueChange).toHaveBeenCalledWith("ACTIVE")

    // Rerender with new value
    rerender(
      <Combobox
        items={statusOptions}
        value="ACTIVE"
        onValueChange={handleValueChange}
        placeholder="انتخاب وضعیت"
      />
    )

    // Reopen popup
    fireEvent.click(trigger)

    // Verify all 3 options are STILL available
    const reopenedOptions = screen.getAllByRole("option")
    expect(reopenedOptions).toHaveLength(3)
    expect(reopenedOptions[0]).toHaveTextContent("همه وضعیت‌ها")
    expect(reopenedOptions[1]).toHaveTextContent("فقط ترم‌های فعال")
    expect(reopenedOptions[2]).toHaveTextContent("فقط ترم‌های بسته شده")
  })

  it("ResponsiveCombobox on mobile does not reopen drawer when closing and returning focus", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList
    )

    const handleValueChange = vi.fn()

    render(
      <ResponsiveCombobox
        items={statusOptions}
        value={undefined}
        onValueChange={handleValueChange}
        placeholder="انتخاب وضعیت"
        drawerTitle="انتخاب وضعیت"
      />
    )

    const triggerInput = screen.getByRole("button", { name: "انتخاب وضعیت" })

    // Open mobile drawer by clicking
    fireEvent.click(triggerInput)

    // Drawer header should be present
    expect(
      screen.getByRole("heading", { name: "انتخاب وضعیت" })
    ).toBeInTheDocument()

    // Close the drawer by clicking close button
    const closeButton = screen.getByRole("button", { name: "بستن" })
    fireEvent.click(closeButton)

    // Focus returns to the trigger input
    fireEvent.focus(triggerInput)

    // Verify the drawer is closed and did NOT reopen
    expect(
      screen.queryByRole("heading", { name: "انتخاب وضعیت" })
    ).not.toBeInTheDocument()
  })

  it("ResponsiveCombobox nested inside ResponsiveDialog on mobile does not reopen when closing the top drawer", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList
    )

    const handleValueChange = vi.fn()

    render(
      <ResponsiveDialog open={true} onOpenChange={() => {}}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>فیلترهای جدول</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ResponsiveCombobox
            items={statusOptions}
            value={undefined}
            onValueChange={handleValueChange}
            placeholder="انتخاب وضعیت"
            drawerTitle="انتخاب وضعیت"
          />
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    )

    // First drawer (parent) should be open
    expect(
      screen.getByRole("heading", { name: "فیلترهای جدول" })
    ).toBeInTheDocument()

    const triggerInput = screen.getByRole("button", { name: "انتخاب وضعیت" })

    // Open second (child) drawer by clicking
    fireEvent.click(triggerInput)

    // Second drawer should now be open on top
    expect(
      screen.getByRole("heading", { name: "انتخاب وضعیت" })
    ).toBeInTheDocument()

    // Backdrop overlay should be rendered with z-[60] and backdrop-blur even when nested inside a dialog
    const overlay = document.querySelector('[data-slot="drawer-overlay"]')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveClass("z-[60]")
    expect(overlay).toHaveClass("backdrop-blur-xs")

    // Close the top drawer by clicking close
    const closeButtons = screen.getAllByRole("button", { name: "بستن" })
    const topCloseButton = closeButtons[closeButtons.length - 1]!
    fireEvent.click(topCloseButton)

    // Simulate focus return to the combobox trigger input
    fireEvent.focus(triggerInput)

    // Verify the top drawer is closed and did not reopen
    expect(
      screen.queryByRole("heading", { name: "انتخاب وضعیت" })
    ).not.toBeInTheDocument()

    // And parent drawer remains open
    expect(
      screen.getByRole("heading", { name: "فیلترهای جدول" })
    ).toBeInTheDocument()
  })
})
