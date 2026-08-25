import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { ROLES } from "@workspace/types"
import { RolePermissionsHeader } from "../components/role-permissions-header"
import { RoleSelector } from "../components/role-selector"
import { RolePermissionsStickyBar } from "../components/role-permissions-sticky-bar"

describe("RolePermissions Components", () => {
  describe("RolePermissionsHeader", () => {
    it("should render title and description", () => {
      render(<RolePermissionsHeader />)
      expect(screen.getByText("مدیریت نقش‌ها و دسترسی‌ها")).toBeInTheDocument()
      expect(
        screen.getByText(
          "پیکربندی و سفارشی‌سازی دسترسی‌های هر نقش به تفکیک آموزشگاه"
        )
      ).toBeInTheDocument()
    })
  })

  describe("RoleSelector", () => {
    it("should render all configurable roles with icons and trigger onSelectRole", () => {
      const handleSelectRole = vi.fn()
      render(
        <RoleSelector
          selectedRole={ROLES.CLERK}
          onSelectRole={handleSelectRole}
          rolePermissionsList={[
            {
              id: "rp-1",
              instituteId: "inst-1",
              role: ROLES.ADMIN,
              permissions: [],
              isOverridden: true,
              createdAt: "",
              updatedAt: "",
            },
          ]}
        />
      )

      expect(screen.getByText("مدیر آموزشگاه")).toBeInTheDocument()
      expect(screen.getByText("کارمند پذیرش")).toBeInTheDocument()
      expect(screen.getByText("استاد / مدرس")).toBeInTheDocument()

      const teacherBtn = screen.getByRole("button", { name: /استاد \/ مدرس/i })
      fireEvent.click(teacherBtn)
      expect(handleSelectRole).toHaveBeenCalledWith(ROLES.TEACHER)
    })
  })

  describe("RolePermissionsStickyBar", () => {
    it("should render all saved state when hasChanges is false", () => {
      render(
        <RolePermissionsStickyBar
          onSave={vi.fn()}
          onReset={vi.fn()}
          isSaving={false}
          isResetting={false}
          hasChanges={false}
          selectedPermissionsCount={12}
        />
      )

      expect(
        screen.getByRole("button", { name: /ذخیره تغییرات/i })
      ).toBeDisabled()
    })

    it("should enable save button when hasChanges is true", () => {
      const handleSave = vi.fn()
      render(
        <RolePermissionsStickyBar
          onSave={handleSave}
          onReset={vi.fn()}
          isSaving={false}
          isResetting={false}
          hasChanges={true}
          selectedPermissionsCount={14}
        />
      )

      const saveBtn = screen.getByRole("button", { name: /ذخیره تغییرات/i })
      expect(saveBtn).not.toBeDisabled()

      fireEvent.click(saveBtn)
      expect(handleSave).toHaveBeenCalled()
    })

    it("should trigger onReset when reset button is clicked", () => {
      const handleReset = vi.fn()
      render(
        <RolePermissionsStickyBar
          onSave={vi.fn()}
          onReset={handleReset}
          isSaving={false}
          isResetting={false}
          hasChanges={false}
          selectedPermissionsCount={10}
        />
      )

      const resetBtn = screen.getByRole("button", {
        name: /بازنشانی به پیش‌فرض/i,
      })
      fireEvent.click(resetBtn)
      expect(handleReset).toHaveBeenCalled()
    })
  })
})
