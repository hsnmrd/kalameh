"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Users, Edit2, KeyRound } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import { cn } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type AuthUser } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { UserRoleBadge } from "../user-role-badge"
import { UserStatusBadge } from "../user-status-badge"
import { UserCard } from "../user-card"

export interface UsersTableProps {
  users: AuthUser[] | undefined
  isLoading: boolean
  onEdit: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
}

export function UsersTable({
  users,
  isLoading,
  onEdit,
  onResetPassword,
}: UsersTableProps) {
  const t = useTranslations("users")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<AuthUser>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("table.name"),
        cell: ({ row }) => {
          const user = row.original
          const initials = `${user.firstName[0] || ""}${user.lastName[0] || ""}`
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {initials}
              </div>
              <span className="text-sm font-medium text-foreground">
                {user.firstName} {user.lastName}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "phone",
        header: t("table.phone"),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-foreground/80">
            {row.original.phone}
          </span>
        ),
      },
      {
        accessorKey: "nationalCode",
        header: t("table.nationalCode"),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.nationalCode || "—"}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: t("table.role"),
        cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
      },
      {
        accessorKey: "isActive",
        header: t("table.status"),
        cell: ({ row }) => <UserStatusBadge isActive={row.original.isActive} />,
      },
      {
        accessorKey: "createdAt",
        header: t("table.createdAt"),
        cell: ({ row }) => {
          try {
            const date = new Date(row.original.createdAt)
            return (
              <span className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(
                  locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                ).format(date)}
              </span>
            )
          } catch {
            return (
              <span className="text-xs text-muted-foreground">
                {String(row.original.createdAt)}
              </span>
            )
          }
        },
      },
      {
        id: "actions",
        header: () => <div className="text-end">{t("table.actions")}</div>,
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center justify-end gap-1.5">
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_USERS}
                mode="disable"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(user)}
                  title={t("actions.edit")}
                  className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Edit2 className="size-3.5" />
                </Button>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_USERS}
                mode="disable"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onResetPassword(user)}
                  title={t("actions.resetPassword")}
                  className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <KeyRound className="size-3.5" />
                </Button>
              </PermissionGuard>
            </div>
          )
        },
      },
    ],
    [locale, onEdit, onResetPassword, t]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users className="size-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {t("table.empty")}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View using shadcn DataTable */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={users}
          emptyMessage={t("table.empty")}
        />
      </div>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={onEdit}
            onResetPassword={onResetPassword}
          />
        ))}
      </div>
    </>
  )
}
