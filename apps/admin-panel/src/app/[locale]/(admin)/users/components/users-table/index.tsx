"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Users, Edit2, KeyRound, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import Image from "next/image"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
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
  onDelete: (user: AuthUser) => void
}

export function UsersTable({
  users,
  isLoading,
  onEdit,
  onResetPassword,
  onDelete,
}: UsersTableProps) {
  const t = useTranslations("users")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<AuthUser>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: t("table.name"),
        cell: ({ row }) => {
          const user = row.original
          const initials = `${user.firstName[0] || ""}${user.lastName[0] || ""}`
          const fullName = `${user.firstName} ${user.lastName}`
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {user.avatarUrl ? (
                  <Image
                    src={getAssetUrl(user.avatarUrl)}
                    alt={fullName}
                    width={36}
                    height={36}
                    className="size-9 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {fullName}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {user.phone}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "role",
        header: t("table.role"),
        cell: ({ row }) => <UserRoleBadge role={row.original.role} />,
      },
      {
        accessorKey: "status",
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

              <PermissionGuard
                permission={PERMISSIONS.DELETE_USERS}
                mode="disable"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(user)}
                  title={t("actions.delete")}
                  className="cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </PermissionGuard>
            </div>
          )
        },
      },
    ],
    [locale, onEdit, onResetPassword, onDelete, t]
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
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Users className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
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
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  )
}
