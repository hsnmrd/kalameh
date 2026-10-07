import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../test/test-utils"
import { HeaderActionsProvider } from "../admin-base-layout/header-actions-context"
import { AdminPageHeader } from "../admin-page-header"
import { AdminPageShell } from "../admin-page-shell"
import { FABSingle } from "@workspace/ui/components/fab"

describe("AdminPageHeader & AdminPageShell Components", () => {
  describe("AdminPageHeader", () => {
    it("should render title, subtitle, and action button", () => {
      const handleAction = vi.fn()
      render(
        <AdminPageHeader
          title="مدیریت پرسنل"
          subtitle="لیست تمامی کارمندان و منشی‌ها"
          action={{
            label: "افزودن کاربر",
            onClick: handleAction,
          }}
        />
      )

      expect(
        screen.getByRole("heading", { name: /مدیریت پرسنل/i })
      ).toBeInTheDocument()
      expect(
        screen.getByText("لیست تمامی کارمندان و منشی‌ها")
      ).toBeInTheDocument()

      const actionButton = screen.getByRole("button", { name: /افزودن کاربر/i })
      expect(actionButton).toBeInTheDocument()
      fireEvent.click(actionButton)
      expect(handleAction).toHaveBeenCalledTimes(1)
    })
  })

  describe("AdminPageShell", () => {
    it("should render filter, content children, and modals in a consistent layout", () => {
      render(
        <HeaderActionsProvider>
          <AdminPageShell
            actions={
              <button type="button" data-testid="page-action">
                Actions
              </button>
            }
            filter={<div data-testid="page-filter">Filter Content</div>}
            modals={<div data-testid="page-modal">Modal Content</div>}
          >
            <div data-testid="page-table">Table Content</div>
          </AdminPageShell>
        </HeaderActionsProvider>
      )

      expect(screen.getByTestId("page-filter")).toBeInTheDocument()
      expect(screen.getByTestId("page-table")).toBeInTheDocument()
      expect(screen.getByTestId("page-modal")).toBeInTheDocument()
    })

    it("renders FAB at 5.5rem from bottom on main pages", () => {
      render(
        <HeaderActionsProvider>
          <AdminPageShell
            fab={<FABSingle onClick={vi.fn()} aria-label="Add item" />}
          >
            <div>Content</div>
          </AdminPageShell>
        </HeaderActionsProvider>
      )

      const fabButton = screen.getByRole("button", { name: "Add item" })
      expect(fabButton).toHaveClass(
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
      )
      expect(fabButton).not.toHaveClass(
        "bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
      )
    })

    it("renders FAB closer to bottom (1.5rem) on inner pages with backHref", () => {
      render(
        <HeaderActionsProvider>
          <AdminPageShell
            backHref="/calendar"
            fab={<FABSingle onClick={vi.fn()} aria-label="Add item" />}
          >
            <div>Content</div>
          </AdminPageShell>
        </HeaderActionsProvider>
      )

      const fabButton = screen.getByRole("button", { name: "Add item" })
      expect(fabButton).toHaveClass(
        "bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
      )
      expect(fabButton).not.toHaveClass(
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
      )
    })
  })
})
