import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { toast } from "@workspace/ui/components/sonner"
import StudentLoginPage from "../page"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock next-intl routing
vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/login",
  useIsRtl: () => true,
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

describe("StudentLoginPage Component", () => {
  it("should render mobile max-w-[480px] container and all inputs", () => {
    const { container } = render(<StudentLoginPage />)

    expect(container.querySelector(".max-w-\\[480px\\]")).toBeInTheDocument()
    expect(screen.getByLabelText(/موبایل|شماره/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/رمز|کلمه عبور/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /ورود|ورود به حساب/i })
    ).toBeInTheDocument()
  })

  it("should display validation errors when submitting invalid phone number", async () => {
    render(<StudentLoginPage />)

    const phoneInput = screen.getByLabelText(/موبایل|شماره/i)
    const passwordInput = screen.getByLabelText(/رمز|کلمه عبور/i)
    const submitBtn = screen.getByRole("button", { name: /ورود|ورود به حساب/i })

    fireEvent.change(phoneInput, { target: { value: "0812" } })
    fireEvent.change(passwordInput, { target: { value: "123" } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      const errorElements = document.querySelectorAll('[data-invalid="true"]')
      expect(errorElements.length).toBeGreaterThan(0)
    })
  })

  it("should toggle password visibility in student login form", () => {
    render(<StudentLoginPage />)

    const passwordInput = screen.getByLabelText(
      /رمز|کلمه عبور/i
    ) as HTMLInputElement
    expect(passwordInput.type).toBe("password")

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

  it("should display error toast if error=staff_not_allowed query param is present", () => {
    const originalLocation = window.location
    delete (window as any).location
    ;(window as any).location = new URL(
      "http://localhost/fa/login?error=staff_not_allowed"
    )

    render(<StudentLoginPage />)

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/کادر اداری|Admin Panel/i)
    )

    window.location = originalLocation
  })
})
