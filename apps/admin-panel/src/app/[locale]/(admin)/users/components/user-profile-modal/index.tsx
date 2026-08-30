"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogCloseButton,
  ResponsiveDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { User, Phone, FileText, Shield, Home } from "lucide-react"
import type { AuthUser } from "@workspace/types"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { UserStatusBadge } from "../user-status-badge"
import { UserRoleBadge } from "../user-role-badge"

export interface UserProfileModalProps {
  user: AuthUser | null
  open: boolean
  onClose: () => void
}

export function UserProfileModal({
  user,
  open,
  onClose,
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
    <ResponsiveDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <ResponsiveDialogContent className="sm:max-h-[90vh] sm:max-w-xl">
        <ResponsiveDialogHeader className="flex flex-row items-center justify-between">
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            <span>{t("profileModal.title")}</span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <div className="space-y-4 px-6 pt-2 pb-6">
          {/* Header Card with Avatar */}
          <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
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
              <h3 className="text-base font-bold text-foreground">
                {fullName}
              </h3>
              <p className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                <Phone className="size-3 text-muted-foreground" />
                <span className="font-mono">{user.phone}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <UserStatusBadge isActive={user.isActive} />
              <UserRoleBadge role={user.role} />
            </div>
          </div>

          {/* Identity & Personal Info */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <FileText className="size-4 text-primary" />
              <span>{t("profileModal.identityInfo")}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 p-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("table.name")}:{" "}
                </span>
                <p className="font-medium text-foreground">{fullName}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("table.nationalCode")}:{" "}
                </span>
                <p className="font-mono font-medium text-foreground">
                  {user.nationalCode || "—"}
                </p>
              </div>
              {user.studentProfile?.fatherName && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    {locale === "fa" ? "نام پدر:" : "Father Name:"}{" "}
                  </span>
                  <p className="font-medium text-foreground">
                    {user.studentProfile.fatherName}
                  </p>
                </div>
              )}
              {formattedBirthDate && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    {locale === "fa" ? "تاریخ تولد:" : "Birth Date:"}{" "}
                  </span>
                  <p className="font-medium text-foreground">
                    {formattedBirthDate}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info (if available) */}
          {(user.studentProfile?.emergencyPhone ||
            user.studentProfile?.address) && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Home className="size-4 text-primary" />
                <span>{t("profileModal.contactInfo")}</span>
              </h4>
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/80 p-3 text-sm sm:grid-cols-2">
                {user.studentProfile?.emergencyPhone && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {locale === "fa"
                        ? "شماره اضطراری:"
                        : "Emergency Phone:"}{" "}
                    </span>
                    <p className="font-mono font-medium text-foreground">
                      {user.studentProfile.emergencyPhone}
                    </p>
                  </div>
                )}
                {user.studentProfile?.address && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {locale === "fa" ? "آدرس:" : "Address:"}{" "}
                    </span>
                    <p className="font-medium text-foreground">
                      {user.studentProfile.address}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System & Access Info */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Shield className="size-4 text-primary" />
              <span>{t("profileModal.systemInfo")}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 p-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("table.role")}:{" "}
                </span>
                <p className="font-medium text-foreground">
                  {t(`roles.${user.role}`)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("table.status")}:{" "}
                </span>
                <p className="font-medium text-foreground">
                  {user.isActive ? t("status.active") : t("status.inactive")}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("table.createdAt")}:{" "}
                </span>
                <p className="font-medium text-foreground">
                  {formattedCreatedDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ResponsiveDialogFooter className="flex justify-end border-t border-border/60 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-5 text-sm"
          >
            {t("profileModal.close")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
