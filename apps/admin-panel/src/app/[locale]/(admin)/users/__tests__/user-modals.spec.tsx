import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ResetPasswordModal } from "../components/reset-password-modal"
import { DeleteUserModal } from "../components/delete-user-modal"
import type { AuthUser } from "@workspace/types"

// Mock sonner toast
vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe("User Modals", () => {
  const mockUser: AuthUser = {
    id: "user-1",
    instituteId: "inst-1",
    firstName: "Ali",
    lastName: "Rezaei",
    phone: "09123456789",
    role: "STUDENT",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  describe("ResetPasswordModal", () => {
    it("should render dialog with user name and input fields when open", () => {
      const handleClose = vi.fn()
      render(
        <ResetPasswordModal user={mockUser} open={true} onClose={handleClose} />
      )

      expect(
        screen.getByText(/تغییر رمز عبور|بازنشانی رمز عبور/i)
      ).toBeInTheDocument()
      expect(screen.getByText(/Ali Rezaei/i)).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /تغییر رمز|ثبت|بازنشانی/i })
      ).toBeInTheDocument()
    })

    it("should call onClose when cancel button is clicked", () => {
      const handleClose = vi.fn()
      render(
        <ResetPasswordModal user={mockUser} open={true} onClose={handleClose} />
      )

      const cancelBtn = screen.getByRole("button", { name: /انصراف|لغو/i })
      fireEvent.click(cancelBtn)

      expect(handleClose).toHaveBeenCalled()
    })
  })

  describe("DeleteUserModal", () => {
    it("should render dialog with user name and delete confirmation button", () => {
      const handleClose = vi.fn()
      render(
        <DeleteUserModal user={mockUser} open={true} onClose={handleClose} />
      )

      expect(
        screen.getByRole("heading", { name: /حذف حساب کاربری پرسنل|delete/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/Ali Rezaei/i)).toBeInTheDocument()
      expect(screen.getByText("09123456789")).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /حذف کاربر|delete/i })
      ).toBeInTheDocument()
    })

    it("should call onClose when cancel button is clicked in delete modal", () => {
      const handleClose = vi.fn()
      render(
        <DeleteUserModal user={mockUser} open={true} onClose={handleClose} />
      )

      const cancelBtn = screen.getByRole("button", { name: /انصراف|لغو/i })
      fireEvent.click(cancelBtn)

      expect(handleClose).toHaveBeenCalled()
    })
  })
})
