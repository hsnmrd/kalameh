import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/test-utils"
import { SidebarFooter } from "../index"

describe("SidebarFooter", () => {
  it("renders logout button and triggers onLogout", () => {
    const onLogout = vi.fn()
    render(<SidebarFooter onLogout={onLogout} />)

    const logoutBtn = screen.getByRole("button", { name: "خروج از حساب" })
    expect(logoutBtn).toBeInTheDocument()

    fireEvent.click(logoutBtn)
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
