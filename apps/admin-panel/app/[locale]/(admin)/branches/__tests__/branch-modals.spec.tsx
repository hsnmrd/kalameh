import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { CreateBranchModal } from "../components/create-branch-modal"
import { EditBranchModal } from "../components/edit-branch-modal"
import type { BranchWithStats } from "@workspace/types"

// Mock sonner toast
vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe("CreateBranchModal & EditBranchModal Components", () => {
  const mockBranch: BranchWithStats = {
    id: "branch-1",
    instituteId: "inst-1",
    name: "شعبه سعادت‌آباد",
    address: "تهران، میدان کاج",
    phones: ["02122003344"],
    isActive: true,
    classesCount: 2,
    usersCount: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  describe("CreateBranchModal", () => {
    it("should render form fields when open", () => {
      render(<CreateBranchModal open={true} onClose={vi.fn()} />)

      expect(
        screen.getByRole("heading", { name: /تعریف شعبه جدید/i })
      ).toBeInTheDocument()
      expect(screen.getByText("نام شعبه")).toBeInTheDocument()
      expect(screen.getByText("آدرس فیزیکی")).toBeInTheDocument()
      expect(screen.getByText("شماره‌های تماس")).toBeInTheDocument()
    })

    it("should display validation errors when submitting empty required fields", async () => {
      render(<CreateBranchModal open={true} onClose={vi.fn()} />)

      const submitBtn = screen.getByRole("button", {
        name: /ثبت شعبه/i,
      })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        const errorElements = document.querySelectorAll(
          '[data-invalid="true"], .text-destructive'
        )
        expect(errorElements.length).toBeGreaterThan(0)
      })
    })

    it("should call onClose when cancel button is clicked", () => {
      const handleClose = vi.fn()
      render(<CreateBranchModal open={true} onClose={handleClose} />)

      const cancelBtn = screen.getByRole("button", { name: /انصراف/i })
      fireEvent.click(cancelBtn)
      expect(handleClose).toHaveBeenCalled()
    })
  })

  describe("EditBranchModal", () => {
    it("should populate fields with branch data when opened", () => {
      render(
        <EditBranchModal branch={mockBranch} open={true} onClose={vi.fn()} />
      )

      expect(
        screen.getByRole("heading", { name: /ویرایش مشخصات شعبه/i })
      ).toBeInTheDocument()
      expect(screen.getByDisplayValue("شعبه سعادت‌آباد")).toBeInTheDocument()
      expect(screen.getByDisplayValue("تهران، میدان کاج")).toBeInTheDocument()
      expect(screen.getByDisplayValue("02122003344")).toBeInTheDocument()
    })

    it("should call onClose when cancel button is clicked", () => {
      const handleClose = vi.fn()
      render(
        <EditBranchModal
          branch={mockBranch}
          open={true}
          onClose={handleClose}
        />
      )

      const cancelBtn = screen.getByRole("button", { name: /انصراف/i })
      fireEvent.click(cancelBtn)
      expect(handleClose).toHaveBeenCalled()
    })
  })
})
