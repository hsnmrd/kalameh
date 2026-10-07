import * as React from "react"
import { fireEvent, render, screen, waitFor } from "../../../../test/test-utils"
import { describe, expect, it, vi } from "vitest"
import {
  BookOpen,
  Building2,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Users,
} from "lucide-react"
import type { NavSection } from "../../nav-list"
import {
  HeaderActionsProvider,
  useHeaderActions,
} from "../../header-actions-context"
import { MobileBottomNavigation, isInnerPage } from "../index"

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

const sections: NavSection[] = [
  {
    id: "institute",
    title: "آموزشگاه کلمه",
    items: [
      { key: "dashboard", href: "/", icon: LayoutDashboard },
      { key: "branches", href: "/branches", icon: Building2 },
      { key: "courses", href: "/courses", icon: BookOpen },
      { key: "classes", href: "/classes", icon: Layers },
      { key: "students", href: "/students", icon: GraduationCap },
      { key: "staff", href: "/users", icon: Users },
      { key: "finance", href: "/transactions", icon: CreditCard },
    ],
  },
]

const defaultProps = {
  sections,
  pathname: "/",
  onLogout: vi.fn(),
  onSwitchLanguage: vi.fn(),
  locale: "fa",
}

describe("MobileBottomNavigation", () => {
  it("keeps four priority links in the bottom bar and places the rest in Menu", async () => {
    render(<MobileBottomNavigation {...defaultProps} />)

    const navigation = screen.getByRole("navigation", {
      name: "ناوبری موبایل",
    })

    expect(navigation).toHaveTextContent("پیشخوان")
    expect(navigation).toHaveTextContent("کلاس‌ها")
    expect(navigation).toHaveTextContent("زبان‌آموزان")
    expect(navigation).toHaveTextContent("امور مالی")
    expect(navigation).not.toHaveTextContent("شعب")

    fireEvent.click(screen.getByRole("button", { name: "منو" }))

    expect(await screen.findByText("سایر بخش‌ها")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toHaveClass("h-[90dvh]", "max-h-[90dvh]")
    expect(screen.getByRole("link", { name: "مدیریت شعب" })).toBeVisible()
    expect(screen.getByRole("link", { name: "مدیریت دوره‌ها" })).toBeVisible()
    expect(screen.getByRole("link", { name: "مدیریت پرسنل" })).toBeVisible()
  })

  it("marks Menu as active when the current page is an overflow destination", () => {
    render(<MobileBottomNavigation {...defaultProps} pathname="/branches" />)

    expect(screen.getByRole("button", { name: "منو" })).toHaveClass(
      "text-primary"
    )
  })

  it("does not render when on an inner page like /calendar/custom", () => {
    const { container } = render(
      <MobileBottomNavigation {...defaultProps} pathname="/calendar/custom" />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("does not render when on an inner page with locale prefix like /fa/calendar/custom", () => {
    const { container } = render(
      <MobileBottomNavigation
        {...defaultProps}
        pathname="/fa/calendar/custom"
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("does not render on deep sub-pages like /classes/scheduling", () => {
    const { container } = render(
      <MobileBottomNavigation
        {...defaultProps}
        pathname="/classes/scheduling"
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("closes the bottom sheet after an overflow link is selected", async () => {
    render(<MobileBottomNavigation {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: "منو" }))
    fireEvent.click(await screen.findByRole("link", { name: "مدیریت شعب" }))

    await waitFor(() => {
      expect(screen.queryByText("سایر بخش‌ها")).not.toBeInTheDocument()
    })
  })

  it("renders focus badge on a direct bottom bar item when it is focused", () => {
    render(<MobileBottomNavigation {...defaultProps} focusedKey="classes" />)

    const badge = screen.getByTestId("mobile-focus-badge")
    expect(badge).toBeInTheDocument()

    const classesLink = screen.getByRole("link", { name: /کلاس‌ها/i })
    expect(classesLink).toContainElement(badge)
  })

  it("renders focus badge on Menu button when an overflow item is focused", async () => {
    render(<MobileBottomNavigation {...defaultProps} focusedKey="branches" />)

    const menuBadge = screen.getByTestId("mobile-menu-focus-badge")
    expect(menuBadge).toBeInTheDocument()

    const menuButton = screen.getByRole("button", { name: /منو/i })
    expect(menuButton).toContainElement(menuBadge)

    // Open menu drawer and verify focus badge is on the overflow link
    fireEvent.click(menuButton)
    const drawerBadge = await screen.findByTestId("mobile-drawer-focus-badge")
    expect(drawerBadge).toBeInTheDocument()
    const branchLink = screen.getByRole("link", { name: /مدیریت شعب/i })
    expect(branchLink).toContainElement(drawerBadge)
  })

  it("does not render when backNavigation is present in HeaderActionsContext", () => {
    function TestWrapper() {
      const { setBackNavigation } = useHeaderActions()

      React.useEffect(() => {
        setBackNavigation({ backHref: "/calendar" })
      }, [setBackNavigation])

      return <MobileBottomNavigation {...defaultProps} pathname="/calendar" />
    }

    const { container } = render(
      <HeaderActionsProvider>
        <TestWrapper />
      </HeaderActionsProvider>
    )

    expect(container).toBeEmptyDOMElement()
  })
})

describe("isInnerPage", () => {
  it("identifies top-level pages as NOT inner pages", () => {
    expect(isInnerPage("/")).toBe(false)
    expect(isInnerPage("")).toBe(false)
    expect(isInnerPage(null)).toBe(false)
    expect(isInnerPage(undefined)).toBe(false)
    expect(isInnerPage("/calendar")).toBe(false)
    expect(isInnerPage("/classes")).toBe(false)
    expect(isInnerPage("/terms")).toBe(false)
    expect(isInnerPage("/teachers")).toBe(false)
    expect(isInnerPage("/students")).toBe(false)
    expect(isInnerPage("/branches")).toBe(false)
    expect(isInnerPage("/setting")).toBe(false)
  })

  it("identifies localized top-level pages as NOT inner pages", () => {
    expect(isInnerPage("/fa")).toBe(false)
    expect(isInnerPage("/en")).toBe(false)
    expect(isInnerPage("/fa/calendar")).toBe(false)
    expect(isInnerPage("/en/classes")).toBe(false)
    expect(isInnerPage("/fa/terms")).toBe(false)
    expect(isInnerPage("/fa/branches")).toBe(false)
  })

  it("identifies nested sub-pages as inner pages", () => {
    expect(isInnerPage("/calendar/custom")).toBe(true)
    expect(isInnerPage("/fa/calendar/custom")).toBe(true)
    expect(isInnerPage("/en/calendar/custom")).toBe(true)
    expect(isInnerPage("/classes/scheduling")).toBe(true)
    expect(isInnerPage("/fa/classes/scheduling")).toBe(true)
    expect(isInnerPage("/classes/scheduling/generate")).toBe(true)
    expect(isInnerPage("/classes/class-123/grades")).toBe(true)
    expect(isInnerPage("/teachers/calendar")).toBe(true)
    expect(isInnerPage("/terms/generate")).toBe(true)
    expect(isInnerPage("/terms/generate/preview")).toBe(true)
  })

  it("handles trailing slashes, query parameters, and hashes correctly", () => {
    expect(isInnerPage("/calendar/custom/")).toBe(true)
    expect(isInnerPage("/calendar/")).toBe(false)
    expect(isInnerPage("/calendar/custom?tab=1")).toBe(true)
    expect(isInnerPage("/calendar?tab=1")).toBe(false)
    expect(isInnerPage("/calendar/custom#section")).toBe(true)
  })
})
