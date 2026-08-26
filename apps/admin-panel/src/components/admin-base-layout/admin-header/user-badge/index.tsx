"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Phone, Shield, Building2, CheckCircle2, LogOut } from "lucide-react"
import { ROLES, type Role, type AuthUser } from "@workspace/types"
import { ResponsivePopover } from "@workspace/ui/components/popover"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { useActiveInstitute } from "@/lib/stores"

export interface UserBadgeProps {
  user?: Partial<AuthUser> & {
    firstName?: string
    lastName?: string
    phone?: string
    role?: Role
    avatarUrl?: string | null
    isActive?: boolean
  }
  onLogout?: () => void
}

export function UserBadge({ user, onLogout }: UserBadgeProps) {
  const t = useTranslations("common")
  const { activeInstitute } = useActiveInstitute()
  const [open, setOpen] = React.useState(false)

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.phone ||
        (user?.role === ROLES.SUPER_ADMIN
          ? t("superAdmin")
          : t("instituteAdmin"))

  const initial = (user?.firstName?.[0] || user?.role?.[0] || "A").toUpperCase()

  const roleLabel =
    user?.role === ROLES.SUPER_ADMIN
      ? t("superAdmin")
      : user?.role === ROLES.ADMIN
        ? t("instituteAdmin")
        : user?.role || t("instituteAdmin")

  const roleBadgeVariant =
    user?.role === ROLES.SUPER_ADMIN
      ? "warning"
      : user?.role === ROLES.ADMIN
        ? "default"
        : "secondary"

  return (
    <ResponsivePopover
      open={open}
      onOpenChange={setOpen}
      drawerTitle={t("userProfile.title")}
      align="end"
      sideOffset={8}
      className="w-72 p-4"
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="group flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-muted/60 p-1 text-foreground shadow-2xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden sm:px-2 sm:py-1.5"
          aria-label={t("userProfile.title")}
        >
          <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-xs">
            {user?.avatarUrl ? (
              <Image
                src={getAssetUrl(user.avatarUrl)}
                alt={fullName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="hidden text-start sm:block">
            <p className="max-w-[130px] truncate text-xs leading-tight font-semibold text-foreground">
              {fullName}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
              {roleLabel}
            </p>
          </div>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Header Profile Info */}
        <div className="flex items-center gap-3 border-b border-border pb-3.5">
          <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-sm">
            {user?.avatarUrl ? (
              <Image
                src={getAssetUrl(user.avatarUrl)}
                alt={fullName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {fullName}
            </p>
            {user?.phone && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                <span dir="ltr" className="font-mono text-[11px]">
                  {user.phone}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="size-3.5 text-muted-foreground" />
              <span>{t("userProfile.role")}</span>
            </span>
            <Badge
              variant={roleBadgeVariant}
              className="px-2 py-0.5 text-[11px]"
            >
              {roleLabel}
            </Badge>
          </div>

          {activeInstitute && (
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="size-3.5 text-muted-foreground" />
                <span>{t("userProfile.institute")}</span>
              </span>
              <span className="max-w-[140px] truncate font-medium text-foreground">
                {activeInstitute.name}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-muted-foreground" />
              <span>{t("userProfile.status")}</span>
            </span>
            <Badge
              variant={user?.isActive !== false ? "success" : "destructive"}
              className="px-2 py-0.5 text-[11px]"
            >
              {user?.isActive !== false
                ? t("userProfile.active")
                : t("userProfile.inactive")}
            </Badge>
          </div>
        </div>

        {/* Logout Action */}
        {onLogout && (
          <div className="border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                onLogout()
              }}
              className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95"
            >
              <LogOut className="size-3.5 shrink-0 text-destructive" />
              <span>{t("logout")}</span>
            </Button>
          </div>
        )}
      </div>
    </ResponsivePopover>
  )
}
