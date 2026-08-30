import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../test/test-utils"
import { StudentToolbar } from "../student-toolbar"

// Mock routing
vi.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useIsRtl: () => true,
  Link: ({
    children,
    href,
    className,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode
    href: string
    className?: string
    "aria-label"?: string
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}))

describe("StudentToolbar Component", () => {
  it("should render app name, logo, and logout button on home page", () => {
    const handleLogout = vi.fn()

    render(<StudentToolbar isHomePage={true} onLogout={handleLogout} />)

    expect(screen.getByText("کلمه")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /خروج|logout/i })
    ).toBeInTheDocument()
  })

  it("should trigger onLogout callback when logout button is clicked", () => {
    const handleLogout = vi.fn()

    render(
      <StudentToolbar
        isHomePage={true}
        locale="fa"
        onSwitchLanguage={vi.fn()}
        onLogout={handleLogout}
      />
    )

    const logoutBtn = screen.getByRole("button", { name: /خروج|logout/i })
    fireEvent.click(logoutBtn)

    expect(handleLogout).toHaveBeenCalledTimes(1)
  })

  it("should render back button on inner pages", () => {
    render(
      <StudentToolbar
        isHomePage={false}
        locale="fa"
        onSwitchLanguage={vi.fn()}
        onLogout={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", { name: /بازگشت|back/i })
    ).toBeInTheDocument()
  })
})
