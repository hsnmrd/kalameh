import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "../../../test/test-utils"
import { PermissionGuard } from "../index"
import { PERMISSIONS, ROLES } from "@workspace/types"
import * as hooks from "@/lib/hooks"
import { toast } from "@workspace/ui/components/sonner"

vi.mock("@workspace/ui/components/sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe("PermissionGuard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders children directly and allows clicks when user has permission in disable mode", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: {
        id: "1",
        instituteId: "inst-1",
        role: ROLES.ADMIN,
        firstName: "Admin",
        lastName: "User",
        phone: "09123456789",
        isActive: true,
        permissions: [PERMISSIONS.MANAGE_BRANCHES],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: ROLES.ADMIN,
      permissions: [PERMISSIONS.MANAGE_BRANCHES],
      isLoading: false,
      hasPermission: (p) => p === PERMISSIONS.MANAGE_BRANCHES,
    })

    const onClickMock = vi.fn()
    render(
      <PermissionGuard permission={PERMISSIONS.MANAGE_BRANCHES} mode="disable">
        <button onClick={onClickMock}>Add Branch</button>
      </PermissionGuard>
    )

    const button = screen.getByRole("button", { name: "Add Branch" })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)

    expect(onClickMock).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("intercepts clicks and shows toast error when user lacks permission in disable mode", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: {
        id: "2",
        instituteId: "inst-1",
        role: ROLES.CLERK,
        firstName: "Clerk",
        lastName: "User",
        phone: "09123456789",
        isActive: true,
        permissions: [PERMISSIONS.VIEW_BRANCHES],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: ROLES.CLERK,
      permissions: [PERMISSIONS.VIEW_BRANCHES],
      isLoading: false,
      hasPermission: () => false,
    })

    const onClickMock = vi.fn()
    render(
      <PermissionGuard permission={PERMISSIONS.MANAGE_BRANCHES} mode="disable">
        <button onClick={onClickMock}>Add Branch</button>
      </PermissionGuard>
    )

    const button = screen.getByRole("button", { name: "Add Branch" })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)

    expect(onClickMock).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledTimes(1)
  })

  it("hides element completely when user lacks permission in hide mode", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: {
        id: "2",
        instituteId: "inst-1",
        role: ROLES.CLERK,
        firstName: "Clerk",
        lastName: "User",
        phone: "09123456789",
        isActive: true,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: ROLES.CLERK,
      permissions: [],
      isLoading: false,
      hasPermission: () => false,
    })

    render(
      <PermissionGuard permission={PERMISSIONS.MANAGE_BRANCHES} mode="hide">
        <button>Add Branch</button>
      </PermissionGuard>
    )

    expect(
      screen.queryByRole("button", { name: "Add Branch" })
    ).not.toBeInTheDocument()
  })

  it("renders fallback when user lacks permission in hide mode", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: {
        id: "2",
        instituteId: "inst-1",
        role: ROLES.CLERK,
        firstName: "Clerk",
        lastName: "User",
        phone: "09123456789",
        isActive: true,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: ROLES.CLERK,
      permissions: [],
      isLoading: false,
      hasPermission: () => false,
    })

    render(
      <PermissionGuard
        permission={PERMISSIONS.MANAGE_BRANCHES}
        mode="hide"
        fallback={<span>No Access</span>}
      >
        <button>Add Branch</button>
      </PermissionGuard>
    )

    expect(
      screen.queryByRole("button", { name: "Add Branch" })
    ).not.toBeInTheDocument()
    expect(screen.getByText("No Access")).toBeInTheDocument()
  })

  it("renders 403 ForbiddenState when user lacks permission in forbidden mode", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: {
        id: "2",
        instituteId: "inst-1",
        role: ROLES.CLERK,
        firstName: "Clerk",
        lastName: "User",
        phone: "09123456789",
        isActive: true,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: ROLES.CLERK,
      permissions: [],
      isLoading: false,
      hasPermission: () => false,
    })

    render(
      <PermissionGuard permission={PERMISSIONS.VIEW_BRANCHES} mode="forbidden">
        <div>Secret Branch Data</div>
      </PermissionGuard>
    )

    expect(screen.queryByText("Secret Branch Data")).not.toBeInTheDocument()
    expect(screen.getByText(/خطای ۴۰۳/i)).toBeInTheDocument()
  })

  it("allows access unconditionally for SUPER_ADMIN role", () => {
    vi.spyOn(hooks, "usePermissions").mockReturnValue({
      user: {
        id: "0",
        instituteId: "inst-0",
        role: ROLES.SUPER_ADMIN,
        firstName: "Super",
        lastName: "Admin",
        phone: "09000000000",
        isActive: true,
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      role: ROLES.SUPER_ADMIN,
      permissions: [],
      isLoading: false,
      hasPermission: () => true,
    })

    render(
      <PermissionGuard
        permission={PERMISSIONS.VIEW_INSTITUTES}
        mode="forbidden"
      >
        <div>All Institutes</div>
      </PermissionGuard>
    )

    expect(screen.getByText("All Institutes")).toBeInTheDocument()
  })
})
