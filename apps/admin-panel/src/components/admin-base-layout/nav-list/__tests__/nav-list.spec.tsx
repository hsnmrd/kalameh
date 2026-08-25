import { describe, it, expect, vi } from "vitest"
import { render, screen } from "../../../../test/test-utils"
import { NavList, type NavSection } from "../index"
import {
  LayoutDashboard,
  Building2,
  ShieldAlert,
  CreditCard,
} from "lucide-react"
import { APP_MODULES } from "@workspace/types"

vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    className,
    onClick,
  }: {
    children: React.ReactNode
    href: string
    className?: string
    onClick?: () => void
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}))

describe("NavList Component", () => {
  const mockSections: NavSection[] = [
    {
      id: "platform",
      title: "مدیریت کل سامانه",
      items: [
        { key: "dashboard", href: "/", icon: LayoutDashboard },
        { key: "institutes", href: "/institutes", icon: ShieldAlert },
      ],
    },
    {
      id: "institute-1",
      title: "آموزشگاه کلمه تهران",
      badge: "tehran",
      items: [
        {
          key: "branches",
          href: "/branches",
          icon: Building2,
          module: APP_MODULES.CLASSES_COURSES,
        },
        {
          key: "finance",
          href: "/transactions",
          icon: CreditCard,
          module: APP_MODULES.FINANCE,
        },
      ],
    },
  ]

  it("should render multiple separated sections with titles and badge", () => {
    render(<NavList sections={mockSections} pathname="/branches" />)

    expect(screen.getByText("مدیریت کل سامانه")).toBeInTheDocument()
    expect(screen.getByText("آموزشگاه کلمه تهران")).toBeInTheDocument()
    expect(screen.getByText("tehran")).toBeInTheDocument()
  })

  it("should mark the active nav item with primary active class", () => {
    render(<NavList sections={mockSections} pathname="/branches" />)

    const activeLink = screen.getByRole("link", { name: /شعب/i })
    expect(activeLink.className).toContain("bg-primary")
  })
})
