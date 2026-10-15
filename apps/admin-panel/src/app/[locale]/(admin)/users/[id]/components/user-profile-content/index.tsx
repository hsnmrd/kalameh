"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { User } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { PERMISSIONS, APP_MODULES, type AuthUser } from "@workspace/types"
import { usersResource } from "@/lib/api"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ProfileSquareHeader } from "@/components/profile-square-header"
import { ProfileTabs, type ProfileTabOption } from "@/components/profile-tabs"
import { UserRoleBadge } from "../../../components/user-role-badge"
import { EditUserModal } from "../../../components/edit-user-modal"
import { ResetPasswordModal } from "../../../components/reset-password-modal"
import { DeleteUserModal } from "../../../components/delete-user-modal"
import { UserActionsMenu } from "../user-actions-menu"
import { UserInfoTab } from "../user-info-tab"

export interface UserProfileContentProps {
  userId: string
}

type UserProfileTab = "information"

export function UserProfileContent({ userId }: UserProfileContentProps) {
  const t = useTranslations("users")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [activeTab, setActiveTab] =
    React.useState<UserProfileTab>("information")
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  const { data: user, isLoading } = useQuery({
    ...usersResource.detail.toQuery(userId),
    enabled: Boolean(userId),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center text-center">
        <p className="text-base font-semibold text-foreground">
          {t("table.empty")}
        </p>
      </div>
    )
  }

  const fullName = `${user.firstName} ${user.lastName}`
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`

  const tabOptions: ProfileTabOption<UserProfileTab>[] = [
    {
      key: "information",
      label: tCommon("profile.tabs.information"),
      icon: <User className="size-4" />,
    },
  ]

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleResetPassword = () => {
    setIsResetPasswordOpen(true)
  }

  const handleDelete = () => {
    setIsDeleteOpen(true)
  }

  return (
    <ModuleGuard module={APP_MODULES.USERS_STAFF}>
      <PermissionGuard permission={PERMISSIONS.VIEW_USERS} mode="forbidden">
        <AdminPageShell
          breadcrumbClassName="hidden sm:block"
          breadcrumb={
            <AdminBreadcrumb
              backHref="/users"
              backLabel={t("title")}
              items={[
                { label: t("title"), href: "/users" },
                { label: fullName },
              ]}
            />
          }
        >
          <div className="flex flex-col gap-5 pb-8">
            {/* Unified Square Profile Header (Mobile: Square Image with Gradient; Desktop: Clean Banner) */}
            <ProfileSquareHeader
              fullName={fullName}
              phone={user.phone}
              avatarUrl={user.avatarUrl}
              initials={initials}
              topLeftBadge={<UserRoleBadge role={user.role} />}
              actions={
                <UserActionsMenu
                  user={user}
                  onEdit={handleEdit}
                  onResetPassword={handleResetPassword}
                  onDelete={handleDelete}
                />
              }
            />

            {/* Profile Tab Selector */}
            <ProfileTabs
              options={tabOptions}
              value={activeTab}
              onChange={setActiveTab}
            />

            {/* Tab Contents */}
            <div className="min-h-[calc(100dvh-4rem)]">
              {activeTab === "information" && <UserInfoTab user={user} />}
            </div>
          </div>

          {/* Action Modals */}
          <EditUserModal
            user={user}
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />

          <ResetPasswordModal
            user={user}
            open={isResetPasswordOpen}
            onClose={() => setIsResetPasswordOpen(false)}
          />

          <DeleteUserModal
            user={user}
            open={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false)
              router.push("/users")
            }}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
