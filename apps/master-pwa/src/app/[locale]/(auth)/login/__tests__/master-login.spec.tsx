import { describe, it, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "../../../../../test/test-utils"
import { toast } from "@workspace/ui/components/sonner"
import MasterLoginPage from "../page"

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

describe("MasterLoginPage Component", () => {
  it("should render mobile max-w-[480px] container and all inputs", () => {
    const { container } = render(<MasterLoginPage />)

    expect(container.querySelector(".max-w-\\[480px\\]")).toBeInTheDocument()
    expect(screen.getByLabelText(/موبایل|شماره/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/رمز|کلمه عبور/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /ورود|ورود به حساب/i })
    ).toBeInTheDocument()
  })

  it("should display validation errors when submitting invalid phone number", async () => {
    render(<MasterLoginPage />)

    const phoneInput = screen.getByLabelText(/موبایل|شماره/i)
    const passwordInput = screen.getByLabelText(/رمز|کلمه عبور/i)
    const submitBtn = screen.getByRole("button", { name: /ورود|ورود به حساب/i })

    fireEvent.change(phoneInput, { target: { value: "0812" } })
    fireEvent.change(passwordInput, { target: { value: "123" } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(
        screen.getByText(/شماره موبایل باید ۱۱ رقم|Phone number/i)
      ).toBeInTheDocument()
    })
  })

  it("should toggle password visibility in master login form", () => {
    render(<MasterLoginPage />)

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

  it("should display error toast if error=only_teachers_allowed query param is present", () => {
    const originalLocation = window.location
    delete (window as unknown as { location?: Location }).location
    ;(window as unknown as { location: URL }).location = new URL(
      "http://localhost/fa/login?error=only_teachers_allowed"
    )

    render(<MasterLoginPage />)

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/مخصوص اساتید|reserved for teachers/i)
    )

    window.location = originalLocation
  })
})
