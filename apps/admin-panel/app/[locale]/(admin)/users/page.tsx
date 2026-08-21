"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { AuthUser } from "@workspace/types"
import { usersResource } from "@/lib/api"
import { UsersHeader } from "./components/users-header"
import { UsersFilter } from "./components/users-filter"
import { UsersTable } from "./components/users-table"
import { CreateUserModal } from "./components/create-user-modal"
import { EditUserModal } from "./components/edit-user-modal"
import { ResetPasswordModal } from "./components/reset-password-modal"

export default function UsersPage() {
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState("")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editUser, setEditUser] = React.useState<AuthUser | null>(null)
  const [resetPasswordUser, setResetPasswordUser] =
    React.useState<AuthUser | null>(null)

  // Fetch users with filters
  const { data: users, isLoading } = useQuery(
    usersResource.list.toQuery({
      role: selectedRole || undefined,
      search: searchValue.trim() || undefined,
    })
  )

  const totalCount = users?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <UsersHeader
        totalCount={totalCount}
        onAddUserClick={() => setCreateModalOpen(true)}
      />

      {/* Search & Role Filters */}
      <UsersFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
      />

      {/* Users Data Table / Mobile Cards */}
      <UsersTable
        users={users}
        isLoading={isLoading}
        onEdit={(user) => setEditUser(user)}
        onResetPassword={(user) => setResetPasswordUser(user)}
      />

      {/* Create User Modal */}
      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editUser}
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        user={resetPasswordUser}
        open={Boolean(resetPasswordUser)}
        onClose={() => setResetPasswordUser(null)}
      />
    </div>
  )
}
