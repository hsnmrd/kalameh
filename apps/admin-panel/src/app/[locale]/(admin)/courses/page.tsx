"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { CourseDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { CoursesHeader } from "./components/courses-header"
import { CoursesTable } from "./components/courses-table"
import { CreateCourseModal } from "./components/create-course-modal"
import { EditCourseModal } from "./components/edit-course-modal"

export default function CoursesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingCourse, setEditingCourse] = React.useState<CourseDto | null>(
    null
  )

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { data: courses, isLoading } = useQuery({
    ...coursesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_COURSES} mode="forbidden">
        <AdminPageShell
          header={
            <CoursesHeader onAddCourse={() => setCreateModalOpen(true)} />
          }
          modals={
            <>
              <CreateCourseModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
              />

              <EditCourseModal
                course={editingCourse}
                open={Boolean(editingCourse)}
                onClose={() => setEditingCourse(null)}
              />
            </>
          }
        >
          <CoursesTable
            courses={courses}
            isLoading={isLoading}
            onEdit={(course) => setEditingCourse(course)}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
