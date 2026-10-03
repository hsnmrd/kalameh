import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../test/test-utils"
import { ModuleGuard } from "../index"
import { APP_MODULES, ROLES } from "@workspace/types"
import * as hooks from "@/lib/hooks"
import * as stores from "@/lib/stores"

describe("ModuleGuard Component", () => {
  it("should render children when module is enabled or user is super-admin", () => {
    render(
      <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
        <div>Active Classes Content</div>
      </ModuleGuard>
    )

    expect(screen.getByText("Active Classes Content")).toBeInTheDocument()
  })

  it("should render upgrade prompt when user is institute admin without module access", () => {
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

    render(
      <ModuleGuard module={APP_MODULES.FINANCE}>
        <div>Finance Secret Page Content</div>
      </ModuleGuard>
    )

    // Should NOT render protected content
    expect(
      screen.queryByText("Finance Secret Page Content")
    ).not.toBeInTheDocument()
    // Should render upgrade card
    expect(screen.getByText(/حسابداری و امور مالی/i)).toBeInTheDocument()
    expect(screen.getByText(/تماس با پشتیبانی فروش/i)).toBeInTheDocument()
  })

  it("should render fallback in hide mode when module not active", () => {
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

    render(
      <ModuleGuard
        module={APP_MODULES.FINANCE}
        mode="hide"
        fallback={<div>Upgrade required fallback</div>}
      >
        <div>Finance Secret Page Content</div>
      </ModuleGuard>
    )

    expect(
      screen.queryByText("Finance Secret Page Content")
    ).not.toBeInTheDocument()
    expect(screen.getByText("Upgrade required fallback")).toBeInTheDocument()
  })

  it("should render disabled container and handle click in disable mode", () => {
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

    render(
      <ModuleGuard module={APP_MODULES.FINANCE} mode="disable">
        <button type="button">Disabled Module Button</button>
      </ModuleGuard>
    )

    const disabledBtn = screen.getByRole("button", {
      name: "Disabled Module Button",
    })
    expect(disabledBtn).toBeInTheDocument()

    // Trigger click on disabled container
    fireEvent.click(disabledBtn.parentElement!)
  })
})
