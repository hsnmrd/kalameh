import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { ProfileTabs, type ProfileTabOption } from "../index"

describe("ProfileTabs", () => {
  const options: ProfileTabOption<string>[] = [
    { key: "information", label: "اطلاعات فردی" },
    { key: "classes", label: "کلاس‌ها", count: 3 },
    { key: "schedule", label: "برنامه زمانی", count: 5 },
  ]

  it("renders all tab options and badges within carousel structure", () => {
    const { container } = render(
      <ProfileTabs options={options} value="information" onChange={vi.fn()} />
    )

    expect(screen.getByText("اطلاعات فردی")).toBeInTheDocument()
    expect(screen.getByText("کلاس‌ها")).toBeInTheDocument()
    expect(screen.getByText("برنامه زمانی")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()

    // Verify carousel structure
    const carousel = container.querySelector('[data-slot="carousel"]')
    expect(carousel).toBeInTheDocument()
    const carouselItems = container.querySelectorAll(
      '[data-slot="carousel-item"]'
    )
    expect(carouselItems).toHaveLength(3)
  })

  it("styles chosen tab gently without high-brightness color", () => {
    render(
      <ProfileTabs options={options} value="information" onChange={vi.fn()} />
    )

    const selectedTab = screen.getByRole("button", { name: /اطلاعات فردی/ })
    const unselectedTab = screen.getByRole("button", { name: /کلاس‌ها/ })

    const selectedClasses = selectedTab.className.split(" ")
    const unselectedClasses = unselectedTab.className.split(" ")

    // Selected tab should use soft bg-muted, not blinding bg-primary
    expect(selectedClasses).toContain("bg-muted")
    expect(selectedClasses).toContain("text-foreground")
    expect(selectedClasses).not.toContain("bg-primary")

    // Unselected tab should not have active bg-muted background
    expect(unselectedClasses).toContain("text-muted-foreground")
    expect(unselectedClasses).not.toContain("bg-muted")
  })

  it("triggers onChange and smooth scrolls when another tab is clicked", () => {
    const scrollToMock = vi.fn()
    window.scrollTo = scrollToMock
    const handleChange = vi.fn()
    render(
      <ProfileTabs
        options={options}
        value="information"
        onChange={handleChange}
      />
    )

    const classesTab = screen.getByRole("button", { name: /کلاس‌ها/ })
    fireEvent.click(classesTab)

    expect(handleChange).toHaveBeenCalledWith("classes")
    expect(scrollToMock).toHaveBeenCalled()
  })
})
