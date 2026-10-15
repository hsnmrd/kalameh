"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { BookOpen, Calendar, Clock, User } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { PERMISSIONS, APP_MODULES, type TeacherDto } from "@workspace/types"
import { teachersResource } from "@/lib/api"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ProfileSquareHeader } from "@/components/profile-square-header"
import { ProfileTabs, type ProfileTabOption } from "@/components/profile-tabs"
import { UserStatusBadge } from "../../../../users/components/user-status-badge"
import { TeacherScheduleStatusBadge } from "../../../components/teacher-schedule-status-badge"
import { EditTeacherModal } from "../../../components/edit-teacher-modal"
import { TeacherAvailabilityModal } from "../../../components/teacher-availability-modal"
import { ResetPasswordModal } from "../../../components/reset-password-modal"
import { DeleteTeacherModal } from "../../../components/delete-teacher-modal"
import { TeacherActionsMenu } from "../teacher-actions-menu"
import { TeacherInfoTab } from "../teacher-info-tab"
import { TeacherClassesTab } from "../teacher-classes-tab"
import { TeacherScheduleTab } from "../teacher-schedule-tab"

export interface TeacherProfileContentProps {
  teacherId: string
}

type TeacherProfileTab = "information" | "classes" | "schedule"

export function TeacherProfileContent({
  teacherId,
}: TeacherProfileContentProps) {
  const t = useTranslations("teachers")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [activeTab, setActiveTab] =
    React.useState<TeacherProfileTab>("information")
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isAvailabilityOpen, setIsAvailabilityOpen] = React.useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  const { data: teacher, isLoading } = useQuery({
    ...teachersResource.detail.toQuery(teacherId),
    enabled: Boolean(teacherId),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center text-center">
        <p className="text-base font-semibold text-foreground">
          {t("table.empty")}
        </p>
      </div>
    )
  }

  const fullName = `${teacher.firstName} ${teacher.lastName}`
  const initials = `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`
  const classesCount =
    teacher.teachingClasses?.length ?? teacher.classesCount ?? 0
  const availabilitiesCount =
    teacher.teacherProfile?.availabilities?.length ?? 0

  const tabOptions: ProfileTabOption<TeacherProfileTab>[] = [
    {
      key: "information",
      label: tCommon("profile.tabs.information"),
      icon: <User className="size-4" />,
    },
    {
      key: "classes",
      label: tCommon("profile.tabs.classes"),
      count: classesCount,
      icon: <BookOpen className="size-4" />,
    },
    {
      key: "schedule",
      label: tCommon("profile.tabs.schedule"),
      count: availabilitiesCount,
      icon: <Clock className="size-4" />,
    },
  ]

  const handleEdit = () => {
    setIsEditOpen(true)
  }

  const handleManageAvailability = () => {
    setIsAvailabilityOpen(true)
  }

  const handleResetPassword = () => {
    setIsResetPasswordOpen(true)
  }

  const handleDelete = () => {
    setIsDeleteOpen(true)
  }

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_TEACHERS} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref="/teachers"
              backLabel={t("title")}
              items={[
                { label: t("title"), href: "/teachers" },
                { label: fullName },
              ]}
            />
          }
        >
          <div className="flex flex-col gap-5 pb-8">
            {/* Unified Square Profile Header (Mobile: Square Image with Gradient; Desktop: Card Banner) */}
            <ProfileSquareHeader
              fullName={fullName}
              phone={teacher.phone}
              avatarUrl={teacher.avatarUrl}
              initials={initials}
              topLeftBadge={
                <TeacherScheduleStatusBadge
                  availabilitiesCount={availabilitiesCount}
                />
              }
              topRightBadge={<UserStatusBadge isActive={teacher.isActive} />}
              actions={
                <TeacherActionsMenu
                  teacher={teacher}
                  onEdit={handleEdit}
                  onManageAvailability={handleManageAvailability}
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
            {activeTab === "information" && (
              <TeacherInfoTab teacher={teacher} />
            )}
            {activeTab === "classes" && <TeacherClassesTab teacher={teacher} />}
            {activeTab === "schedule" && (
              <TeacherScheduleTab
                teacher={teacher}
                onManageAvailability={handleManageAvailability}
              />
            )}
          </div>

          {/* Action Modals */}
          <EditTeacherModal
            teacher={teacher}
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />

          <TeacherAvailabilityModal
            teacher={teacher}
            open={isAvailabilityOpen}
            onClose={() => setIsAvailabilityOpen(false)}
            instituteId={teacher.instituteId}
          />

          <ResetPasswordModal
            teacher={teacher}
            open={isResetPasswordOpen}
            onClose={() => setIsResetPasswordOpen(false)}
          />

          <DeleteTeacherModal
            teacher={teacher}
            open={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false)
              router.push("/teachers")
            }}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
