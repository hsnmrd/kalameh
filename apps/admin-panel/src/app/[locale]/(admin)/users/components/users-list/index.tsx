"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Users, Edit2, KeyRound, Trash2, Eye } from "lucide-react"
import {
  MobileList,
  MobileListItem,
  MobileListItemIcon,
  MobileListItemContent,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@workspace/ui/components/context-menu"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type AuthUser } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { UserStatusBadge } from "../user-status-badge"

export interface UsersListProps {
  users: AuthUser[] | undefined
  isLoading: boolean
  onViewProfile: (user: AuthUser) => void
  onEdit: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
  onDelete: (user: AuthUser) => void
}

export function UsersList({
  users,
  isLoading,
  onViewProfile,
  onEdit,
  onResetPassword,
  onDelete,
}: UsersListProps) {
  const t = useTranslations("users")

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
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
    <MobileList>
      {users.map((user, index) => {
        const fullName = `${user.firstName} ${user.lastName}`
        const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`

        return (
          <ContextMenu key={user.id}>
            <ContextMenuTrigger>
              <MobileListItem
                onClick={() => onViewProfile(user)}
                isLast={index === users.length - 1}
              >
                <MobileListItemIcon>
                  {user.avatarUrl ? (
                    <Image
                      src={getAssetUrl(user.avatarUrl)}
                      alt={fullName}
                      width={44}
                      height={44}
                      className="size-11 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs font-semibold text-foreground">
                      {initials}
                    </span>
                  )}
                </MobileListItemIcon>

                <MobileListItemContent
                  primary={fullName}
                  secondary={
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span>{user.phone}</span>
                      <span>•</span>
                      <span className="font-sans text-muted-foreground">
                        {t(`roles.${user.role}`)}
                      </span>
                    </div>
                  }
                />

                <MobileListItemTrailing>
                  <UserStatusBadge isActive={user.isActive} />
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <PermissionGuard permission={PERMISSIONS.VIEW_USERS} mode="hide">
                <ContextMenuItem onClick={() => onViewProfile(user)}>
                  <Eye className="me-2 size-4 text-muted-foreground" />
                  {t("actions.viewProfile")}
                </ContextMenuItem>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_USERS}
                mode="hide"
              >
                <ContextMenuItem onClick={() => onEdit(user)}>
                  <Edit2 className="me-2 size-4 text-muted-foreground" />
                  {t("actions.edit")}
                </ContextMenuItem>

                <ContextMenuItem onClick={() => onResetPassword(user)}>
                  <KeyRound className="me-2 size-4 text-muted-foreground" />
                  {t("actions.resetPassword")}
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => onDelete(user)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="me-2 size-4 text-destructive" />
                  {t("actions.delete")}
                </ContextMenuItem>
              </PermissionGuard>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </MobileList>
  )
}
