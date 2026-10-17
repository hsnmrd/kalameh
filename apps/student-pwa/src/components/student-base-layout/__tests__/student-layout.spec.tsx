import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, act } from "../../../test/test-utils"
import { StudentToolbar } from "../student-toolbar"
import { StudentBottomNav } from "../student-bottom-nav"
import { StudentBaseLayout } from "../index"
import * as pwaProvider from "@/components/pwa-provider"

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
    "aria-current": ariaCurrent,
  }: {
    children: React.ReactNode
    href: string
    className?: string
    "aria-label"?: string
    "aria-current"?: string
  }) => (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
    >
      {children}
    </a>
  ),
}))

describe("StudentToolbar Component", () => {
  it("should render institute name, logo, theme toggle, and logout button on home page", () => {
    const handleLogout = vi.fn()

    render(
      <StudentToolbar
        isHomePage={true}
        instituteName="آموزشگاه فراتاک"
        onLogout={handleLogout}
      />
    )

    expect(screen.getByText("آموزشگاه فراتاک")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /خروج|logout/i })).toHaveClass(
      "size-11"
    )
    expect(screen.getByRole("link", { name: "آموزشگاه فراتاک" })).toHaveClass(
      "min-h-11"
    )
    expect(
      screen.getByRole("button", { name: /toggle theme/i })
    ).toBeInTheDocument()
  })

  it("should fallback to app name on home page when institute name is not available", () => {
    render(<StudentToolbar isHomePage={true} onLogout={vi.fn()} />)

    expect(screen.getByText("کلمه")).toBeInTheDocument()
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

  it("should render back button and page title on inner pages", () => {
    render(
      <StudentToolbar
        isHomePage={false}
        pathname="/classes"
        locale="fa"
        onSwitchLanguage={vi.fn()}
        onLogout={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: /بازگشت|back/i })).toHaveClass(
      "size-11"
    )
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "کلاس‌ها"
    )
  })

  it("should apply scrolled styling when window scrolls down", () => {
    const { container } = render(
      <StudentToolbar isHomePage={true} onLogout={vi.fn()} />
    )

    const header = container.querySelector("header")
    expect(header).toHaveClass("border-transparent", "bg-transparent")

    act(() => {
      Object.defineProperty(window, "scrollY", {
        writable: true,
        configurable: true,
        value: 50,
      })
      Object.defineProperty(document.documentElement, "scrollTop", {
        writable: true,
        configurable: true,
        value: 50,
      })
      window.dispatchEvent(new Event("scroll"))
    })

    expect(header).toHaveClass(
      "border-border",
      "bg-card/90",
      "backdrop-blur-md"
    )
  })

  it("should show install button when PWA is installable and invoke installApp on click", async () => {
    const installAppMock = vi.fn().mockResolvedValue(true)
    vi.spyOn(pwaProvider, "usePwaContext").mockReturnValue({
      isSupported: true,
      isInstalled: false,
      isInstallable: true,
      isOffline: false,
      isUpdateAvailable: false,
      installApp: installAppMock,
      updateApp: vi.fn(),
    })

    render(<StudentToolbar isHomePage={true} onLogout={vi.fn()} />)

    const installBtn = screen.getByRole("button", {
      name: /نصب برنامه|install/i,
    })
    expect(installBtn).toBeInTheDocument()

    fireEvent.click(installBtn)
    expect(installAppMock).toHaveBeenCalledTimes(1)
  })
})

describe("StudentBottomNav Component", () => {
  it("should render all 5 navigation links in a floating pill container", () => {
    render(<StudentBottomNav pathname="/dashboard" />)

    const nav = screen.getByRole("navigation", { name: "کلمه" })
    expect(nav).toHaveClass(
      "fixed",
      "rounded-[50px]",
      "border",
      "border-border",
      "bg-card/80",
      "backdrop-blur-md"
    )

    expect(screen.getByRole("link", { name: /خانه/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /کلاس‌ها/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /تمرین/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /پرداخت‌ها/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /پروفایل/i })).toBeInTheDocument()
  })

  it("should mark the active item with page aria-current and primary color styling", () => {
    render(<StudentBottomNav pathname="/classes" />)

    const activeLink = screen.getByRole("link", { name: /کلاس‌ها/i })
    expect(activeLink).toHaveAttribute("aria-current", "page")
    expect(activeLink).toHaveClass("text-primary")

    const inactiveLink = screen.getByRole("link", { name: /خانه/i })
    expect(inactiveLink).not.toHaveAttribute("aria-current")
    expect(inactiveLink).toHaveClass("text-muted-foreground")
  })
})

describe("StudentBaseLayout Component", () => {
  it("should render children along with toolbar and navigation", () => {
    render(
      <StudentBaseLayout>
        <div data-testid="page-content">Child content</div>
      </StudentBaseLayout>
    )

    expect(screen.getByTestId("page-content")).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: "کلمه" })).toBeInTheDocument()
  })
})
