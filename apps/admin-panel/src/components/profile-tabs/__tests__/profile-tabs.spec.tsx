import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@/test/test-utils"
import { ProfileTabs, type ProfileTabOption } from "../index"

describe("ProfileTabs", () => {
  const options: ProfileTabOption<string>[] = [
    { key: "information", label: "اطلاعات فردی" },
    { key: "classes", label: "کلاس‌ها", count: 3 },
    { key: "schedule", label: "برنامه زمانی", count: 5 },
  ]

  it("renders all tab options and badges", () => {
    render(
      <ProfileTabs options={options} value="information" onChange={vi.fn()} />
    )

    expect(screen.getByText("اطلاعات فردی")).toBeInTheDocument()
    expect(screen.getByText("کلاس‌ها")).toBeInTheDocument()
    expect(screen.getByText("برنامه زمانی")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
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
