import { describe, it, expect } from "vitest"
import { render, screen } from "../../../../../test/test-utils"
import { UserRoleBadge } from "../components/user-role-badge"
import { UserStatusBadge } from "../components/user-status-badge"
import { ROLES } from "@workspace/types"

describe("User Badges", () => {
  describe("UserRoleBadge", () => {
    it("should render correct badge for SUPER_ADMIN", () => {
      render(<UserRoleBadge role={ROLES.SUPER_ADMIN} />)
      expect(screen.getByText(/ادمین کل|مدیر کل/i)).toBeInTheDocument()
    })

    it("should render correct badge for INSTITUTE_ADMIN", () => {
      render(<UserRoleBadge role={ROLES.INSTITUTE_ADMIN} />)
      expect(screen.getByText(/مدیر آموزشگاه/i)).toBeInTheDocument()
    })

    it("should render correct badge for CLERK", () => {
      render(<UserRoleBadge role={ROLES.CLERK} />)
      expect(screen.getByText(/منشی/i)).toBeInTheDocument()
    })

    it("should render correct badge for STUDENT", () => {
      render(<UserRoleBadge role={ROLES.STUDENT} />)
      expect(screen.getByText(/زبان‌آموز|دانشجو/i)).toBeInTheDocument()
    })
  })

  describe("UserStatusBadge", () => {
    it("should render active status badge with emerald indicator", () => {
      const { container } = render(<UserStatusBadge isActive={true} />)
      expect(screen.getByText(/فعال/i)).toBeInTheDocument()
      expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument()
    })

    it("should render inactive status badge with rose indicator", () => {
      const { container } = render(<UserStatusBadge isActive={false} />)
      expect(screen.getByText(/غیرفعال/i)).toBeInTheDocument()
      expect(container.querySelector(".bg-rose-500")).toBeInTheDocument()
    })
  })
})
