import { describe, expect, it } from "vitest"
import { render, screen } from "../../../test/test-utils"
import { ProfileSquareHeader } from "../index"

describe("ProfileSquareHeader Component", () => {
  it("renders full name, phone, and topLeftBadge correctly", () => {
    render(
      <ProfileSquareHeader
        fullName="علی رضایی"
        phone="09123456789"
        topLeftBadge={<span data-testid="top-left-badge">زبان‌آموز</span>}
      />
    )

    expect(screen.getByText("علی رضایی")).toBeInTheDocument()
    expect(screen.getByText("09123456789")).toBeInTheDocument()
    expect(screen.getByTestId("top-left-badge")).toBeInTheDocument()
  })

  it("renders avatar image when avatarUrl is provided", () => {
    render(
      <ProfileSquareHeader
        fullName="سارا محمدی"
        phone="09120000000"
        avatarUrl="/uploads/avatar.jpg"
      />
    )

    const image = screen.getByRole("img", { name: "سارا محمدی" })
    expect(image).toBeInTheDocument()
  })

  it("renders initials fallback when avatarUrl is not provided", () => {
    render(
      <ProfileSquareHeader
        fullName="رضا احمدی"
        phone="09121111111"
        initials="RA"
      />
    )

    expect(screen.getByText("RA")).toBeInTheDocument()
  })
})
