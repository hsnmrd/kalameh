import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, act } from "../../../../test/test-utils"
import {
  HeaderActionsProvider,
  useHeaderActions,
} from "../../header-actions-context"
import { AdminHeader } from "../index"

const mockPathname = vi.fn(() => "/classes/scheduling/plans/plan-1")

vi.mock("@/i18n/routing", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useIsRtl: () => true,
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string
    children?: React.ReactNode
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

function TestHeaderWithNavigation({
  backHref,
  backLabel,
}: {
  backHref?: string
  backLabel?: string
}) {
  const { setBackNavigation } = useHeaderActions()

  React.useEffect(() => {
    if (backHref) {
      setBackNavigation({ backHref, backLabel })
      return () => setBackNavigation(null)
    }
  }, [backHref, backLabel, setBackNavigation])

  return <AdminHeader />
}

describe("AdminHeader", () => {
  it("renders page title and does not show back button by default", () => {
    render(
      <HeaderActionsProvider>
        <AdminHeader />
      </HeaderActionsProvider>
    )

    expect(screen.getByText("تقویم آموزشی هوشمند")).toBeInTheDocument()
    expect(
      screen.queryByTestId("admin-header-back-btn")
    ).not.toBeInTheDocument()
  })

  it("renders back button as icon button next to page title when backNavigation is set", () => {
    render(
      <HeaderActionsProvider>
        <TestHeaderWithNavigation
          backHref="/classes/scheduling"
          backLabel="بازگشت به تقویم آموزشی هوشمند"
        />
      </HeaderActionsProvider>
    )

    expect(screen.getByText("تقویم آموزشی هوشمند")).toBeInTheDocument()
    const backBtn = screen.getByTestId("admin-header-back-btn")
    expect(backBtn).toBeInTheDocument()
    expect(backBtn).toHaveAttribute("href", "/classes/scheduling")
    expect(backBtn).toHaveAttribute(
      "aria-label",
      "بازگشت به تقویم آموزشی هوشمند"
    )
  })

  it("renders platform dashboard title for super admin on root path", () => {
    mockPathname.mockReturnValueOnce("/")
    render(
      <HeaderActionsProvider>
        <AdminHeader role="SUPER_ADMIN" />
      </HeaderActionsProvider>
    )

    expect(screen.getByText("پیشخوان سامانه")).toBeInTheDocument()
  })

  it("renders institute dashboard title on /overview path", () => {
    mockPathname.mockReturnValueOnce("/overview")
    render(
      <HeaderActionsProvider>
        <AdminHeader role="SUPER_ADMIN" />
      </HeaderActionsProvider>
    )

    expect(screen.getByText("پیشخوان آموزشگاه")).toBeInTheDocument()
  })

  it("renders inner container with max-w-7xl and mx-auto matching page container", () => {
    const { container } = render(
      <HeaderActionsProvider>
        <AdminHeader />
      </HeaderActionsProvider>
    )

    const innerContainer = container.querySelector(".max-w-7xl")
    expect(innerContainer).toBeInTheDocument()
    expect(innerContainer).toHaveClass("mx-auto", "w-full", "max-w-7xl")
  })

  it("applies border and background when scrolled while remaining sticky and visible", () => {
    const { container } = render(
      <HeaderActionsProvider>
        <AdminHeader />
      </HeaderActionsProvider>
    )

    const header = container.querySelector("header")
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass("sticky")
    expect(header).toHaveClass("top-0")
    expect(header).toHaveClass("border-transparent")

    // Simulate scrolling down past top threshold
    act(() => {
      Object.defineProperty(window, "scrollY", {
        writable: true,
        configurable: true,
        value: 100,
      })
      Object.defineProperty(document.documentElement, "scrollTop", {
        writable: true,
        configurable: true,
        value: 100,
      })
      window.dispatchEvent(new Event("scroll"))
    })

    // Should stay visible with scrolled styling
    expect(header).toHaveClass("border-border")
    expect(header).toHaveClass("backdrop-blur-md")
    expect(header).not.toHaveClass("-translate-y-full")
  })
})
