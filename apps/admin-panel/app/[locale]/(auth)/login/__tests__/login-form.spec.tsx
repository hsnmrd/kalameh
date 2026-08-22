import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import AdminLoginPage from "../page"

// Mock next-intl routing
vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/login",
  useIsRtl: () => true,
}))

// Mock sonner toast
vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe("AdminLoginPage Component", () => {
  it("should render all login form inputs and labels", () => {
    render(<AdminLoginPage />)

    expect(screen.getByLabelText(/موبایل|شماره/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/رمز|کلمه عبور/i)).toBeInTheDocument()
    expect(
      screen.getByLabelText(/شناسه آموزشگاه|زیردامنه/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /ورود|ورود به حساب/i })
    ).toBeInTheDocument()
  })

  it("should validate form and show validation errors on invalid submit", async () => {
    render(<AdminLoginPage />)

    const phoneInput = screen.getByLabelText(/موبایل|شماره/i)
    const passwordInput = screen.getByLabelText(/رمز|کلمه عبور/i)
    const submitBtn = screen.getByRole("button", { name: /ورود|ورود به حساب/i })

    fireEvent.change(phoneInput, { target: { value: "123" } })
    fireEvent.change(passwordInput, { target: { value: "12" } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      // Validation error messages should be displayed
      const errorElements = document.querySelectorAll('[data-invalid="true"]')
      expect(errorElements.length).toBeGreaterThan(0)
    })
  })

  it("should toggle password visibility when show password button is clicked", () => {
    render(<AdminLoginPage />)

    const passwordInput = screen.getByLabelText(
      /رمز|کلمه عبور/i
    ) as HTMLInputElement
    expect(passwordInput.type).toBe("password")

    // Find the toggle button inside PasswordInput
    const toggleButton = screen.getByRole("button", {
      name: /show password/i,
    })
    fireEvent.click(toggleButton)

    expect(passwordInput.type).toBe("text")

    const hideButton = screen.getByRole("button", {
      name: /hide password/i,
    })
    fireEvent.click(hideButton)
    expect(passwordInput.type).toBe("password")
  })
})
