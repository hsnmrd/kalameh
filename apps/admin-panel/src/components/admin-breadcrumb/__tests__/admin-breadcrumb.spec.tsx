import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/test-utils"
import { AdminBreadcrumb } from "../index"

describe("AdminBreadcrumb", () => {
  it("renders breadcrumb items on one line and truncates the last item", () => {
    render(
      <AdminBreadcrumb
        items={[
          { label: "مدیریت کلاس‌ها", href: "/classes" },
          { label: "تقویم آموزشی هوشمند", href: "/classes/scheduling" },
          { label: "ساخت پیشنهادهای زمان‌بندی" },
        ]}
      />
    )

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveClass("flex", "min-w-0", "flex-1")

    const firstLink = screen.getByRole("link", { name: "مدیریت کلاس‌ها" })
    expect(firstLink).toHaveAttribute("href", "/classes")
    expect(firstLink).toHaveClass("shrink-0", "whitespace-nowrap")

    const secondLink = screen.getByRole("link", {
      name: "تقویم آموزشی هوشمند",
    })
    expect(secondLink).toHaveAttribute("href", "/classes/scheduling")
    expect(secondLink).toHaveClass("shrink-0", "whitespace-nowrap")

    const lastItem = screen.getByText("ساخت پیشنهادهای زمان‌بندی")
    expect(lastItem).toHaveClass(
      "min-w-0",
      "truncate",
      "font-medium",
      "text-foreground"
    )
    expect(lastItem).toHaveAttribute("title", "ساخت پیشنهادهای زمان‌بندی")
    expect(lastItem).toHaveAttribute("aria-current", "page")
  })

  it("returns null when items array is empty", () => {
    const { container } = render(<AdminBreadcrumb items={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
