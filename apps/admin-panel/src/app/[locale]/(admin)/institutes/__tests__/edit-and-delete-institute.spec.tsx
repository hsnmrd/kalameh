import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { EditInstituteModal } from "../components/edit-institute-modal"
import { DeleteInstituteModal } from "../components/delete-institute-modal"
import { InstituteCard } from "../components/institute-card"
import type { InstituteWithStats } from "@workspace/types"

// Mock sonner toast
vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const mockInstitute: InstituteWithStats = {
  id: "e58ed763-928c-4155-bee9-fdbaaadc15f3",
  name: "آموزشگاه تهران",
  subdomain: "tehran",
  isActive: true,
  logoUrl: null,
  primaryColor: "#10b981",
  address: "تهران، خیابان آزادی",
  phones: ["02166554433"],
  bankAccountName: "حساب مرکزی",
  bankCardNumber: "6037991812345678",
  bankShaba: "IR120170000000123456789012",
  classesCount: 10,
  usersCount: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("EditInstituteModal Component", () => {
  it("should render and populate existing institute data", () => {
    render(
      <EditInstituteModal
        open={true}
        onClose={vi.fn()}
        institute={mockInstitute}
      />
    )

    expect(
      screen.getByRole("heading", { name: /ویرایش مشخصات آموزشگاه/i })
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue("آموزشگاه تهران")).toBeInTheDocument()
    expect(screen.getByDisplayValue("tehran")).toBeInTheDocument()
  })

  it("should call onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <EditInstituteModal
        open={true}
        onClose={handleClose}
        institute={mockInstitute}
      />
    )

    const cancelBtn = screen.getByRole("button", { name: /انصراف/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalled()
  })
})

describe("DeleteInstituteModal Component", () => {
  it("should render warning dialog with institute details", () => {
    render(
      <DeleteInstituteModal
        open={true}
        onClose={vi.fn()}
        institute={mockInstitute}
      />
    )

    expect(
      screen.getByRole("heading", { name: /حذف آموزشگاه/i })
    ).toBeInTheDocument()
    expect(screen.getByText("آموزشگاه تهران")).toBeInTheDocument()
    expect(screen.getByText(/tehran\.kalameh\.ir/i)).toBeInTheDocument()
  })

  it("should trigger onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(
      <DeleteInstituteModal
        open={true}
        onClose={handleClose}
        institute={mockInstitute}
      />
    )

    const cancelBtn = screen.getByRole("button", { name: /انصراف/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalled()
  })
})

describe("InstituteCard Component", () => {
  it("should render card with primary manage button and status badge", () => {
    const { rerender } = render(<InstituteCard institute={mockInstitute} />)
    expect(
      screen.getByRole("button", { name: /مدیریت و ورود به پنل آموزشگاه/i })
    ).toBeInTheDocument()
    expect(screen.getByText("فعال")).toBeInTheDocument()

    const inactiveInstitute: InstituteWithStats = {
      ...mockInstitute,
      isActive: false,
    }
    rerender(<InstituteCard institute={inactiveInstitute} />)
    expect(screen.getByText("مسدود شده")).toBeInTheDocument()
  })

  it("should display institute name, contact details, and actions trigger button", () => {
    render(<InstituteCard institute={mockInstitute} />)
    expect(screen.getByText("آموزشگاه تهران")).toBeInTheDocument()
    expect(screen.getByText("تهران، خیابان آزادی")).toBeInTheDocument()
    expect(screen.getByText("02166554433")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /عملیات آموزشگاه/i })
    ).toBeInTheDocument()
  })
})
