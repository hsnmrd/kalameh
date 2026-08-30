"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Building2, LogOut, Settings } from "lucide-react"
import { ROLES, type Role, type AuthUser } from "@workspace/types"
import { ResponsivePopover } from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter } from "@/i18n/routing"
import { InstituteSwitcher } from "../../institute-switcher"
import { UserBadgeTrigger } from "./user-badge-trigger"
import { ActiveInstituteCard } from "./active-institute-card"
import { UserProfileDetails } from "./user-profile-details"

export interface UserBadgeProps {
  user?: Partial<AuthUser> & {
    firstName?: string
    lastName?: string
    phone?: string
    role?: Role
    avatarUrl?: string | null
    isActive?: boolean
  }
  role?: Role
  onLogout?: () => void
}

export function UserBadge({ user, role, onLogout }: UserBadgeProps) {
  const t = useTranslations("common")
  const router = useRouter()
  const { activeInstitute, clearActiveInstitute } = useActiveInstitute()
  const [open, setOpen] = React.useState(false)
  const [switcherOpen, setSwitcherOpen] = React.useState(false)

  const isSuperAdmin = (user?.role || role) === ROLES.SUPER_ADMIN
  const hasActiveInstitute = isSuperAdmin && !!activeInstitute

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.phone || (isSuperAdmin ? t("superAdmin") : t("instituteAdmin"))

  const userInitial = (
    user?.firstName?.[0] ||
    user?.role?.[0] ||
    "A"
  ).toUpperCase()

  const roleLabel = isSuperAdmin
    ? t("superAdmin")
    : user?.role === ROLES.ADMIN
      ? t("instituteAdmin")
      : user?.role || t("instituteAdmin")

  const roleBadgeVariant = isSuperAdmin
    ? "warning"
    : user?.role === ROLES.ADMIN
      ? "default"
      : "secondary"

  const handleChangeInstitute = () => {
    setOpen(false)
    setSwitcherOpen(true)
  }

  const handleCloseInstitute = () => {
    setOpen(false)
    clearActiveInstitute()
    router.push("/institutes")
  }

  const handleLogout = () => {
    setOpen(false)
    onLogout?.()
  }

  return (
    <>
      <ResponsivePopover
        open={open}
        onOpenChange={setOpen}
        drawerTitle={t("userProfile.title")}
        align="end"
        sideOffset={8}
        className="w-80 p-4"
        trigger={
          <UserBadgeTrigger
            hasActiveInstitute={hasActiveInstitute}
            activeInstituteName={activeInstitute?.name}
            activeInstituteSubdomain={activeInstitute?.subdomain}
            activeInstituteLogoUrl={activeInstitute?.logoUrl}
            activeInstitutePrimaryColor={activeInstitute?.primaryColor}
            userAvatarUrl={user?.avatarUrl}
            fullName={fullName}
            userInitial={userInitial}
            roleLabel={roleLabel}
          />
        }
      >
        <div className="flex flex-col gap-3.5">
          {/* Active Institute Section for Super Admin */}
          {hasActiveInstitute && activeInstitute && (
            <ActiveInstituteCard
              name={activeInstitute.name}
              subdomain={activeInstitute.subdomain}
              logoUrl={activeInstitute.logoUrl}
              primaryColor={activeInstitute.primaryColor}
              onChangeInstitute={handleChangeInstitute}
              onCloseInstitute={handleCloseInstitute}
            />
          )}

          {/* User Profile Information */}
          <UserProfileDetails
            fullName={fullName}
            phone={user?.phone}
            avatarUrl={user?.avatarUrl}
            initial={userInitial}
            roleLabel={roleLabel}
            roleBadgeVariant={roleBadgeVariant}
            instituteName={!isSuperAdmin ? activeInstitute?.name : undefined}
            isActive={user?.isActive !== false}
          />

          {/* Super Admin Action to select an institute when none is active */}
          {isSuperAdmin && !hasActiveInstitute && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleChangeInstitute}
              className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-border text-xs font-medium text-foreground hover:bg-muted active:scale-95"
            >
              <Building2 className="size-3.5 text-muted-foreground" />
              <span>{t("userProfile.selectInstitute")}</span>
            </Button>
          )}

          {/* Settings Action */}
          <div className="border-t border-border pt-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setOpen(false)
                router.push("/setting")
              }}
              className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-border text-xs font-medium text-foreground hover:bg-muted active:scale-95"
            >
              <Settings className="size-3.5 text-muted-foreground" />
              <span>{t("settings")}</span>
            </Button>
          </div>

          {/* Logout Action */}
          {onLogout && (
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleLogout}
                className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95"
              >
                <LogOut className="size-3.5 shrink-0 text-destructive" />
                <span>{t("logout")}</span>
              </Button>
            </div>
          )}
        </div>
      </ResponsivePopover>

      {isSuperAdmin && (
        <InstituteSwitcher open={switcherOpen} onOpenChange={setSwitcherOpen} />
      )}
    </>
  )
}
