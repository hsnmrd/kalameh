"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { StudentDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { coursesResource, studentsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { StudentsFilter } from "./components/students-filter"
import { StudentsTable } from "./components/students-table"
import { StudentsList } from "./components/students-list"
import { CreateStudentModal } from "./components/create-student-modal"
import { EditStudentModal } from "./components/edit-student-modal"
import { StudentProfileModal } from "./components/student-profile-modal"
import { ResetPasswordModal } from "./components/reset-password-modal"

export default function StudentsPage() {
  const t = useTranslations("students")
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedCourseId, setSelectedCourseId] = React.useState("ALL")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editStudent, setEditStudent] = React.useState<StudentDto | null>(null)
  const [profileStudent, setProfileStudent] = React.useState<StudentDto | null>(
    null
  )
  const [resetPasswordStudent, setResetPasswordStudent] =
    React.useState<StudentDto | null>(null)

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.STUDENTS)

  // Fetch list of courses for course filter & modal selection
  const { data: courses = [] } = useQuery({
    ...coursesResource.list.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  // Query students
  const isActiveFilter =
    selectedStatus === "ACTIVE"
      ? true
      : selectedStatus === "INACTIVE"
        ? false
        : undefined

  const { data: students, isLoading } = useQuery({
    ...studentsResource.list.toQuery({
      search: searchValue.trim() || undefined,
      courseId: selectedCourseId !== "ALL" ? selectedCourseId : undefined,
      isActive: isActiveFilter,
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const totalCount = students?.length ?? 0

  return (
    <ModuleGuard module={APP_MODULES.STUDENTS}>
      <PermissionGuard permission={PERMISSIONS.VIEW_STUDENTS} mode="forbidden">
        <AdminPageShell
          filter={
            <StudentsFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedCourseId={selectedCourseId}
              onCourseChange={setSelectedCourseId}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              courses={courses}
            />
          }
          modals={
            <>
              {/* Create Student Modal */}
              <CreateStudentModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                instituteId={activeInstituteId}
              />

              {/* Edit Student Modal */}
              <EditStudentModal
                student={editStudent}
                open={Boolean(editStudent)}
                onClose={() => setEditStudent(null)}
              />

              {/* View Student Dossier / Profile Modal */}
              <StudentProfileModal
                student={profileStudent}
                open={Boolean(profileStudent)}
                onClose={() => setProfileStudent(null)}
              />

              {/* Reset Password Modal */}
              <ResetPasswordModal
                student={resetPasswordStudent}
                open={Boolean(resetPasswordStudent)}
                onClose={() => setResetPasswordStudent(null)}
              />
            </>
          }
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_STUDENTS}
              mode="hide"
            >
              <FABSingle
                onClick={() => setCreateModalOpen(true)}
                aria-label={t("addStudent")}
              />
            </PermissionGuard>
          }
        >
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <StudentsTable
              students={students}
              isLoading={isLoading}
              onViewProfile={(student) => setProfileStudent(student)}
              onEdit={(student) => setEditStudent(student)}
              onResetPassword={(student) => setResetPasswordStudent(student)}
            />
          </div>

          {/* Mobile Flat List View */}
          <div className="lg:hidden">
            <StudentsList
              students={students}
              isLoading={isLoading}
              onViewProfile={(student) => setProfileStudent(student)}
              onEdit={(student) => setEditStudent(student)}
              onResetPassword={(student) => setResetPasswordStudent(student)}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
