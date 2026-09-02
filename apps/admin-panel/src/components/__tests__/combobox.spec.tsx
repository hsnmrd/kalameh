import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { Combobox } from "@workspace/ui/components/combobox"

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
})
