import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ResetPasswordModal } from "../components/reset-password-modal"
import { DeleteUserModal } from "../components/delete-user-modal"
import { UserProfileModal } from "../components/user-profile-modal"
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
      expect(screen.getAllByText(/Ali Rezaei/i).length).toBeGreaterThan(0)
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

  describe("UserProfileModal", () => {
    it("should render dialog with user profile details when open", () => {
      const handleClose = vi.fn()
      render(
        <UserProfileModal user={mockUser} open={true} onClose={handleClose} />
      )

      expect(
        screen.getByRole("heading", { name: /مشخصات پرسنل|profile/i })
      ).toBeInTheDocument()
      expect(screen.getAllByText(/Ali Rezaei/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText("09123456789").length).toBeGreaterThan(0)
      expect(
        screen.getAllByRole("button", { name: /بستن|close/i }).length
      ).toBeGreaterThan(0)
    })

    it("should call onClose when close button is clicked", () => {
      const handleClose = vi.fn()
      render(
        <UserProfileModal user={mockUser} open={true} onClose={handleClose} />
      )

      const closeButtons = screen.getAllByRole("button", {
        name: /بستن|close/i,
      })
      fireEvent.click(closeButtons[0]!)

      expect(handleClose).toHaveBeenCalled()
    })

    it("should render action buttons in footer and invoke callbacks", () => {
      const handleClose = vi.fn()
      const handleEdit = vi.fn()
      const handleResetPassword = vi.fn()
      const handleDelete = vi.fn()

      render(
        <UserProfileModal
          user={mockUser}
          open={true}
          onClose={handleClose}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />
      )

      const moreBtn = screen.getByRole("button", {
        name: /مشاهده جزئیات|View Profile/i,
      })
      fireEvent.click(moreBtn)

      const resetPwdItem = screen.getByText(/بازنشانی رمز عبور|Reset Password/i)
      const editItem = screen.getByText(/ویرایش مشخصات|Edit/i)
      const deleteItem = screen.getByText(/حذف حساب کاربری|Delete/i)

      expect(resetPwdItem).toBeInTheDocument()
      expect(editItem).toBeInTheDocument()
      expect(deleteItem).toBeInTheDocument()

      fireEvent.click(editItem)
      expect(handleClose).toHaveBeenCalled()
      expect(handleEdit).toHaveBeenCalledWith(mockUser)
    })
  })
})
