"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { FABSingle } from "@workspace/ui/components/fab"
import type { TeacherDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { teachersResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { TeachersFilter } from "./components/teachers-filter"
import { TeachersTable } from "./components/teachers-table"
import { TeachersList } from "./components/teachers-list"
import { CreateTeacherModal } from "./components/create-teacher-modal"
import { EditTeacherModal } from "./components/edit-teacher-modal"
import { TeacherProfileModal } from "./components/teacher-profile-modal"
import { ResetPasswordModal } from "./components/reset-password-modal"
import { DeleteTeacherModal } from "./components/delete-teacher-modal"

export default function TeachersPage() {
  const t = useTranslations("teachers")
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [viewProfileTeacher, setViewProfileTeacher] =
    React.useState<TeacherDto | null>(null)
  const [editTeacher, setEditTeacher] = React.useState<TeacherDto | null>(null)
  const [deleteTeacher, setDeleteTeacher] = React.useState<TeacherDto | null>(
    null
  )
  const [resetPasswordTeacher, setResetPasswordTeacher] =
    React.useState<TeacherDto | null>(null)

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const isActiveFilter =
    selectedStatus === "ACTIVE"
      ? true
      : selectedStatus === "INACTIVE"
        ? false
        : undefined

  const { data: teachers, isLoading } = useQuery({
    ...teachersResource.list.toQuery({
      search: searchValue.trim() || undefined,
      isActive: isActiveFilter,
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_TEACHERS} mode="forbidden">
        <AdminPageShell
          filter={
            <TeachersFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onAddClick={() => setCreateModalOpen(true)}
            />
          }
          modals={
            <>
              {/* Create Teacher Modal */}
              <CreateTeacherModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                instituteId={activeInstituteId}
              />

              {/* View Teacher Profile Modal */}
              <TeacherProfileModal
                teacher={viewProfileTeacher}
                open={Boolean(viewProfileTeacher)}
                onClose={() => setViewProfileTeacher(null)}
                onEdit={(teacher) => {
                  setViewProfileTeacher(null)
                  setEditTeacher(teacher)
                }}
                onResetPassword={(teacher) => {
                  setViewProfileTeacher(null)
                  setResetPasswordTeacher(teacher)
                }}
              />

              {/* Edit Teacher Modal */}
              <EditTeacherModal
                teacher={editTeacher}
                open={Boolean(editTeacher)}
                onClose={() => setEditTeacher(null)}
              />

              {/* Reset Password Modal */}
              <ResetPasswordModal
                teacher={resetPasswordTeacher}
                open={Boolean(resetPasswordTeacher)}
                onClose={() => setResetPasswordTeacher(null)}
              />

              {/* Delete Teacher Modal */}
              <DeleteTeacherModal
                teacher={deleteTeacher}
                open={Boolean(deleteTeacher)}
                onClose={() => setDeleteTeacher(null)}
              />
            </>
          }
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_TEACHERS}
              mode="hide"
            >
              <FABSingle
                onClick={() => setCreateModalOpen(true)}
                aria-label={t("addTeacher")}
              />
            </PermissionGuard>
          }
        >
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <TeachersTable
              teachers={teachers}
              isLoading={isLoading}
              onViewProfile={(teacher) => setViewProfileTeacher(teacher)}
              onEdit={(teacher) => setEditTeacher(teacher)}
              onResetPassword={(teacher) => setResetPasswordTeacher(teacher)}
              onDelete={(teacher) => setDeleteTeacher(teacher)}
            />
          </div>

          {/* Mobile Flat List View */}
          <div className="lg:hidden">
            <TeachersList
              teachers={teachers}
              isLoading={isLoading}
              onViewProfile={(teacher) => setViewProfileTeacher(teacher)}
              onEdit={(teacher) => setEditTeacher(teacher)}
              onResetPassword={(teacher) => setResetPasswordTeacher(teacher)}
              onDelete={(teacher) => setDeleteTeacher(teacher)}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
