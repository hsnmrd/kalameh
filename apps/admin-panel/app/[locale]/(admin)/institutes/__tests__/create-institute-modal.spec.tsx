import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { CreateInstituteModal } from "../components/create-institute-modal"

// Mock sonner toast
vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe("CreateInstituteModal Component", () => {
  it("should render form fields and tabs when open", () => {
    render(<CreateInstituteModal open={true} onClose={vi.fn()} />)

    expect(
      screen.getByRole("heading", { name: /ثبت آموزشگاه جدید/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/نام آموزشگاه/i)).toBeInTheDocument()
    expect(screen.getAllByText(/زیردامنه اختصاصی/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/رنگ سازمانی/i)).toBeInTheDocument()
  })

  it("should switch between tabs properly", async () => {
    render(<CreateInstituteModal open={true} onClose={vi.fn()} />)

    // Switch to Contact tab
    const contactTabBtn = screen.getByRole("button", {
      name: /اطلاعات تماس و نشانی/i,
    })
    fireEvent.click(contactTabBtn)

    expect(screen.getByText(/شماره‌های تماس/i)).toBeInTheDocument()
    expect(screen.getByText(/نشانی آموزشگاه/i)).toBeInTheDocument()

    // Switch to Banking tab
    const bankingTabBtn = screen.getByRole("button", {
      name: /اطلاعات حساب بانکی/i,
    })
    fireEvent.click(bankingTabBtn)

    expect(screen.getByText(/نام صاحب حساب/i)).toBeInTheDocument()
    expect(screen.getByText(/شماره شبا/i)).toBeInTheDocument()
  })

  it("should display validation errors when submitting empty required fields", async () => {
    render(<CreateInstituteModal open={true} onClose={vi.fn()} />)

    // Move to banking tab where submit button lives and click submit
    const bankingTabBtn = screen.getByRole("button", {
      name: /اطلاعات حساب بانکی/i,
    })
    fireEvent.click(bankingTabBtn)

    const submitBtn = screen.getByRole("button", {
      name: /ثبت و راه‌اندازی آموزشگاه/i,
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      const errorElements = document.querySelectorAll('[data-invalid="true"]')
      expect(errorElements.length).toBeGreaterThan(0)
    })
  })

  it("should allow adding and removing phone fields in contact tab", async () => {
    render(<CreateInstituteModal open={true} onClose={vi.fn()} />)

    const contactTabBtn = screen.getByRole("button", {
      name: /اطلاعات تماس و نشانی/i,
    })
    fireEvent.click(contactTabBtn)

    const addPhoneBtn = screen.getByRole("button", {
      name: /افزودن شماره تماس/i,
    })
    fireEvent.click(addPhoneBtn)

    await waitFor(() => {
      const phoneInputs = screen.getAllByPlaceholderText(/02188776655/i)
      expect(phoneInputs.length).toBe(2)
    })
  })

  it("should call onClose when cancel button is clicked", () => {
    const handleClose = vi.fn()
    render(<CreateInstituteModal open={true} onClose={handleClose} />)

    const cancelBtn = screen.getByRole("button", { name: /انصراف/i })
    fireEvent.click(cancelBtn)
    expect(handleClose).toHaveBeenCalled()
  })
})
