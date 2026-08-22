import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { CreateUserModal } from "../components/create-user-modal"
import { EditUserModal } from "../components/edit-user-modal"
import type { AuthUser } from "@workspace/types"

// Mock sonner toast
vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe("CreateUserModal & EditUserModal Components", () => {
  const mockUser: AuthUser = {
    id: "user-1",
    instituteId: "inst-1",
    firstName: "Farhad",
    lastName: "Majidi",
    phone: "09127777777",
    role: "STUDENT",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  describe("CreateUserModal", () => {
    it("should render form fields when open", () => {
      render(<CreateUserModal open={true} onClose={vi.fn()} />)

      expect(
        screen.getByRole("heading", { name: /تعریف کاربر|افزودن کاربر/i })
      ).toBeInTheDocument()
      expect(screen.getByText("نام خانوادگی")).toBeInTheDocument()
      expect(screen.getAllByText(/شماره تماس/i).length).toBeGreaterThan(0)
    })

    it("should display validation errors when submitting empty required fields", async () => {
      render(<CreateUserModal open={true} onClose={vi.fn()} />)

      const submitBtn = screen.getByRole("button", {
        name: /ثبت کاربر/i,
      })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        const errorElements = document.querySelectorAll('[data-invalid="true"]')
        expect(errorElements.length).toBeGreaterThan(0)
      })
    })

    it("should call onClose when cancel button is clicked", () => {
      const handleClose = vi.fn()
      render(<CreateUserModal open={true} onClose={handleClose} />)

      const cancelBtn = screen.getByRole("button", { name: /انصراف|لغو/i })
      fireEvent.click(cancelBtn)
      expect(handleClose).toHaveBeenCalled()
    })
  })

  describe("EditUserModal", () => {
    it("should populate fields with user data when open", () => {
      render(<EditUserModal user={mockUser} open={true} onClose={vi.fn()} />)

      expect(
        screen.getByRole("heading", {
          name: /ویرایش اطلاعات پرسنل|ویرایش اطلاعات کاربر/i,
        })
      ).toBeInTheDocument()
      const phoneInput = document.querySelector(
        'input[name="phone"]'
      ) as HTMLInputElement
      expect(phoneInput).toBeInTheDocument()
      expect(phoneInput.value).toBe("09127777777")
    })

    it("should call onClose when cancel button is clicked", () => {
      const handleClose = vi.fn()
      render(
        <EditUserModal user={mockUser} open={true} onClose={handleClose} />
      )

      const cancelBtn = screen.getByRole("button", { name: /انصراف|لغو/i })
      fireEvent.click(cancelBtn)
      expect(handleClose).toHaveBeenCalled()
    })
  })
})
