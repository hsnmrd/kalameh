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
import { MobileBottomNavigation } from "../index"

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

    expect(navigation).toHaveTextContent("پیشخوان مدیریت")
    expect(navigation).toHaveTextContent("مدیریت کلاس‌ها")
    expect(navigation).toHaveTextContent("فراگیران و زبان‌آموزان")
    expect(navigation).toHaveTextContent("امور مالی و فیش‌ها")
    expect(navigation).not.toHaveTextContent("شعب آموزشگاه")

    fireEvent.click(screen.getByRole("button", { name: "منو" }))

    expect(await screen.findByText("سایر بخش‌ها")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "شعب آموزشگاه" })).toBeVisible()
    expect(
      screen.getByRole("link", { name: "برنامه‌های آموزشی" })
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: "پرسنل و دسترسی‌ها" })
    ).toBeVisible()
  })

  it("marks Menu as active when the current page is an overflow destination", () => {
    render(
      <MobileBottomNavigation {...defaultProps} pathname="/branches/branch-1" />
    )

    expect(screen.getByRole("button", { name: "منو" })).toHaveClass(
      "text-primary"
    )
  })

  it("closes the bottom sheet after an overflow link is selected", async () => {
    render(<MobileBottomNavigation {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: "منو" }))
    fireEvent.click(await screen.findByRole("link", { name: "شعب آموزشگاه" }))

    await waitFor(() => {
      expect(screen.queryByText("سایر بخش‌ها")).not.toBeInTheDocument()
    })
  })
})
