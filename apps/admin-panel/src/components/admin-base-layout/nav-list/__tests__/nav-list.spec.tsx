import { describe, it, expect, vi } from "vitest"
import { render, screen } from "../../../../test/test-utils"
import { NavList, type NavSection } from "../index"
import {
  LayoutDashboard,
  Building2,
  ShieldAlert,
  CreditCard,
} from "lucide-react"
import { APP_MODULES, ROLES } from "@workspace/types"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"

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
    expect(activeLink.className).toContain("bg-primary/10")
    expect(activeLink.className).toContain("text-primary")
  })

  it("should render lock icon on modules not enabled for the active institute", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: {
        id: "1",
        role: ROLES.INSTITUTE_ADMIN,
        instituteId: "inst-1",
        firstName: "Inst",
        lastName: "Admin",
        phone: "09121111111",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      hasPermission: () => true,
      hasAnyPermission: () => true,
      hasAllPermissions: () => true,
      isSuperAdmin: false,
      isInstituteAdmin: true,
      isClerk: false,
      isTeacher: false,
    } as any)

    vi.spyOn(stores, "useActiveInstitute").mockReturnValue({
      activeInstitute: {
        id: "inst-1",
        name: "Test Institute",
        subdomain: "test",
        phones: [],
        enabledModules: [APP_MODULES.CLASSES_COURSES],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      activeInstituteId: "inst-1",
      selectInstitute: vi.fn(),
      clearActiveInstitute: vi.fn(),
      setActiveInstitute: vi.fn(),
    } as any)

    render(<NavList sections={mockSections} pathname="/transactions" />)

    // Verify item is active and lock icon has text-primary
    const lockIcon = screen.getByLabelText("Locked Module")
    expect(lockIcon).toBeInTheDocument()
    expect(lockIcon).toHaveClass("text-primary")
  })
})
