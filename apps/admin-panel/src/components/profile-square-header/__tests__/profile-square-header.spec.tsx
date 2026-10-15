import { describe, expect, it } from "vitest"
import { render, screen } from "@/test/test-utils"
import { ProfileSquareHeader } from "../index"

describe("ProfileSquareHeader", () => {
  it("renders full name, phone, and badges correctly in mobile and desktop layouts", () => {
    render(
      <ProfileSquareHeader
        fullName="علی رضایی"
        phone="09123456789"
        topLeftBadge={<span data-testid="top-left-badge">برنامه زمانی</span>}
        topRightBadge={<span data-testid="top-right-badge">فعال</span>}
        actions={<button type="button">عملیات</button>}
      />
    )

    // Full name and phone should be present
    expect(screen.getAllByText("علی رضایی").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("09123456789").length).toBeGreaterThanOrEqual(1)

    // Badges should be rendered
    expect(
      screen.getAllByTestId("top-left-badge").length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByTestId("top-right-badge").length
    ).toBeGreaterThanOrEqual(1)
  })

  it("renders avatar image when avatarUrl is provided", () => {
    render(
      <ProfileSquareHeader
        fullName="سارا محمدی"
        avatarUrl="/uploads/avatar.jpg"
      />
    )

    const images = screen.getAllByRole("img", { name: "سارا محمدی" })
    expect(images.length).toBeGreaterThanOrEqual(1)
  })

  it("renders initials fallback when avatarUrl is not provided", () => {
    render(<ProfileSquareHeader fullName="رضا احمدی" initials="RA" />)

    expect(screen.getAllByText("RA").length).toBeGreaterThanOrEqual(1)
  })
})
