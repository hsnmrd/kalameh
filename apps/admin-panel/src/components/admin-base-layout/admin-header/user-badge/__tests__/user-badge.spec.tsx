import { afterEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "../../../../../test/test-utils"
import { ROLES } from "@workspace/types"
import { UserBadge } from "../index"

describe("UserBadge", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("opens profile details in a bottom-sheet drawer on mobile", () => {
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

    const onLogout = vi.fn()
    render(
      <UserBadge
        user={{
          firstName: "علی",
          lastName: "رضایی",
          phone: "09121234567",
          role: ROLES.ADMIN,
          isActive: true,
        }}
        onLogout={onLogout}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "اطلاعات کاربری" }))

    expect(
      screen.getByRole("heading", { name: "اطلاعات کاربری" })
    ).toBeInTheDocument()
    expect(screen.getAllByText("علی رضایی")).toHaveLength(2)

    fireEvent.click(screen.getByRole("button", { name: "خروج از حساب" }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})
