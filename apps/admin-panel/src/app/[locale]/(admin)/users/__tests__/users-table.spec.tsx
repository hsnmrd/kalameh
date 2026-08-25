import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "../../../../../test/test-utils"
import { UsersTable } from "../components/users-table"
import { UsersFilter } from "../components/users-filter"
import type { AuthUser } from "@workspace/types"

describe("UsersTable & UsersFilter Components", () => {
  const mockUsers: AuthUser[] = [
    {
      id: "user-1",
      instituteId: "inst-1",
      firstName: "Ali",
      lastName: "Rezaei",
      phone: "09121111111",
      role: "STUDENT",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "user-2",
      instituteId: "inst-1",
      firstName: "Sara",
      lastName: "Ahmadi",
      phone: "09122222222",
      role: "CLERK",
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  describe("UsersTable", () => {
    it("should render loading spinner when isLoading is true", () => {
      const { container } = render(
        <UsersTable
          users={undefined}
          isLoading={true}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
        />
      )

      // Should display spinner or loading state
      expect(container.querySelector("svg.animate-spin")).toBeInTheDocument()
    })

    it("should render empty state message when users array is empty", () => {
      render(
        <UsersTable
          users={[]}
          isLoading={false}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
        />
      )

      expect(
        screen.getByText(/کاربری یافت نشد|هیچ کاربری/i)
      ).toBeInTheDocument()
    })

    it("should render user rows with names and phone numbers", () => {
      render(
        <UsersTable
          users={mockUsers}
          isLoading={false}
          onEdit={vi.fn()}
          onResetPassword={vi.fn()}
        />
      )

      expect(screen.getAllByText(/Ali Rezaei/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText("09121111111").length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Sara Ahmadi/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText("09122222222").length).toBeGreaterThan(0)
    })

    it("should trigger onEdit, onResetPassword, and onDelete callbacks when action buttons are clicked", () => {
      const handleEdit = vi.fn()
      const handleResetPassword = vi.fn()
      const handleDelete = vi.fn()

      render(
        <UsersTable
          users={mockUsers}
          isLoading={false}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />
      )

      const editButtons = screen.getAllByRole("button", {
        name: /ویرایش کاربر|ویرایش/i,
      })
      fireEvent.click(editButtons[0]!)
      expect(handleEdit).toHaveBeenCalledWith(mockUsers[0])

      const resetButtons = screen.getAllByRole("button", {
        name: /بازنشانی رمز|تغییر رمز/i,
      })
      fireEvent.click(resetButtons[0]!)
      expect(handleResetPassword).toHaveBeenCalledWith(mockUsers[0])

      const deleteButtons = screen.getAllByRole("button", {
        name: /حذف کاربر|حذف/i,
      })
      fireEvent.click(deleteButtons[0]!)
      expect(handleDelete).toHaveBeenCalledWith(mockUsers[0])
    })
  })

  describe("UsersFilter", () => {
    it("should render search input and trigger onSearchChange", () => {
      const handleSearchChange = vi.fn()
      render(
        <UsersFilter
          searchValue=""
          onSearchChange={handleSearchChange}
          selectedRole=""
          onRoleChange={vi.fn()}
        />
      )

      const searchInput = screen.getByPlaceholderText(/جستجو نام|جستجو/i)
      fireEvent.change(searchInput, { target: { value: "Ali" } })
      expect(handleSearchChange).toHaveBeenCalledWith("Ali")
    })

    it("should render role combobox with all options", () => {
      render(
        <UsersFilter
          searchValue=""
          onSearchChange={vi.fn()}
          selectedRole=""
          onRoleChange={vi.fn()}
        />
      )

      const combobox = screen.getByRole("combobox")
      expect(combobox).toBeInTheDocument()
      expect(combobox).toHaveTextContent("همه پرسنل")
    })
  })
})
