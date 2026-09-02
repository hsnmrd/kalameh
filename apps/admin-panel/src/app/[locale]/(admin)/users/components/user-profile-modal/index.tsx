"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Phone, KeyRound, Edit2, Trash2, MoreVertical } from "lucide-react"
import { PERMISSIONS, type AuthUser } from "@workspace/types"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"
import { PermissionGuard } from "@/components/permission-guard"
import { UserStatusBadge } from "../user-status-badge"
import { UserRoleBadge } from "../user-role-badge"

export interface UserProfileModalProps {
  user: AuthUser | null
  open: boolean
  onClose: () => void
  onEdit?: (user: AuthUser) => void
  onResetPassword?: (user: AuthUser) => void
  onDelete?: (user: AuthUser) => void
}

export function UserProfileModal({
  user,
  open,
  onClose,
  onEdit,
  onResetPassword,
  onDelete,
}: UserProfileModalProps) {
  const t = useTranslations("users")
  const locale = useLocale()

  if (!user) return null

  const fullName = `${user.firstName} ${user.lastName}`
  const initial = user.firstName?.[0] || user.lastName?.[0] || "U"

  const formattedCreatedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(new Date(user.createdAt))

  const formattedBirthDate = user.studentProfile?.birthDate
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(user.studentProfile.birthDate))
    : null

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-xl">
        <FormDialogHeader>
          <div className="flex items-center gap-2">
            {(onResetPassword || onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden"
                  aria-label={t("actions.viewProfile")}
                >
                  <MoreVertical className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  drawerTitle={fullName}
                  className="min-w-48"
                >
                  {onResetPassword && (
                    <PermissionGuard
                      permission={PERMISSIONS.MANAGE_USERS}
                      mode="hide"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          onClose()
                          onResetPassword(user)
                        }}
                      >
                        <KeyRound className="size-4 text-muted-foreground" />
                        <span>{t("actions.resetPassword")}</span>
                      </DropdownMenuItem>
                    </PermissionGuard>
                  )}

                  {onEdit && (
                    <PermissionGuard
                      permission={PERMISSIONS.MANAGE_USERS}
                      mode="hide"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          onClose()
                          onEdit(user)
                        }}
                      >
                        <Edit2 className="size-4 text-muted-foreground" />
                        <span>{t("actions.edit")}</span>
                      </DropdownMenuItem>
                    </PermissionGuard>
                  )}

                  {onDelete && (
                    <PermissionGuard
                      permission={PERMISSIONS.MANAGE_USERS}
                      mode="hide"
                    >
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          onClose()
                          onDelete(user)
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                        <span>{t("actions.delete")}</span>
                      </DropdownMenuItem>
                    </PermissionGuard>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <FormDialogTitle>{t("profileModal.title")}</FormDialogTitle>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {/* Header Card with Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {user.avatarUrl ? (
                <Image
                  src={getAssetUrl(user.avatarUrl)}
                  alt={fullName}
                  width={56}
                  height={56}
                  className="size-14 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground sm:text-lg">
                {fullName}
              </h3>
              <p className="flex items-center gap-1.5 pt-0.5 text-sm text-muted-foreground">
                <Phone className="size-3.5 text-muted-foreground" />
                <span className="font-mono">{user.phone}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <UserStatusBadge isActive={user.isActive} />
              <UserRoleBadge role={user.role} />
            </div>
          </div>

          {/* Identity & Personal Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.name")}
              </span>
              <p className="font-medium text-foreground">{fullName}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.nationalCode")}
              </span>
              <p className="font-mono font-medium text-foreground">
                {user.nationalCode || "—"}
              </p>
            </div>
            {user.studentProfile?.fatherName && (
              <div>
                <span className="text-xs text-muted-foreground">
                  {locale === "fa" ? "نام پدر" : "Father Name"}
                </span>
                <p className="font-medium text-foreground">
                  {user.studentProfile.fatherName}
                </p>
              </div>
            )}
            {formattedBirthDate && (
              <div>
                <span className="text-xs text-muted-foreground">
                  {locale === "fa" ? "تاریخ تولد" : "Birth Date"}
                </span>
                <p className="font-medium text-foreground">
                  {formattedBirthDate}
                </p>
              </div>
            )}
          </div>

          {/* Contact Info (if available) */}
          {(user.studentProfile?.emergencyPhone ||
            user.studentProfile?.address) && (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {user.studentProfile?.emergencyPhone && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    {locale === "fa" ? "شماره اضطراری" : "Emergency Phone"}
                  </span>
                  <p className="font-mono font-medium text-foreground">
                    {user.studentProfile.emergencyPhone}
                  </p>
                </div>
              )}
              {user.studentProfile?.address && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    {locale === "fa" ? "آدرس" : "Address"}
                  </span>
                  <p className="font-medium text-foreground">
                    {user.studentProfile.address}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* System & Access Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.role")}
              </span>
              <p className="font-medium text-foreground">
                {t(`roles.${user.role}`)}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.status")}
              </span>
              <p className="font-medium text-foreground">
                {user.isActive ? t("status.active") : t("status.inactive")}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.createdAt")}
              </span>
              <p className="font-medium text-foreground">
                {formattedCreatedDate}
              </p>
            </div>
          </div>
        </div>

        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 min-w-28 rounded-xl text-sm font-medium"
          >
            {t("profileModal.close")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
