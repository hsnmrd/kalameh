"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { CourseDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { CoursesTable } from "./components/courses-table"
import { CoursesList } from "./components/courses-list"
import { CoursesFilter } from "./components/courses-filter"
import { CreateCourseModal } from "./components/create-course-modal"
import { EditCourseModal } from "./components/edit-course-modal"

export default function CoursesPage() {
  const t = useTranslations("courses")
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingCourse, setEditingCourse] = React.useState<CourseDto | null>(
    null
  )
  const [search, setSearch] = React.useState("")
  const [selectedPrerequisiteId, setSelectedPrerequisiteId] =
    React.useState("ALL")

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  // All courses for prerequisite dropdown options
  const { data: allCourses = [] } = useQuery({
    ...coursesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  // Filtered courses from backend
  const { data: courses = [], isLoading } = useQuery({
    ...coursesResource.list.toQuery({
      instituteId: activeInstituteId,
      search: search.trim() || undefined,
      prerequisiteId:
        selectedPrerequisiteId !== "ALL" ? selectedPrerequisiteId : undefined,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_COURSES} mode="forbidden">
        <AdminPageShell
          filters={
            <CoursesFilter
              search={search}
              onSearchChange={setSearch}
              selectedPrerequisiteId={selectedPrerequisiteId}
              onPrerequisiteChange={setSelectedPrerequisiteId}
              courses={allCourses}
            />
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
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_COURSES}
              mode="hide"
            >
              <FABSingle
                onClick={() => setCreateModalOpen(true)}
                aria-label={t("addCourse")}
              />
            </PermissionGuard>
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <CoursesTable
              courses={courses}
              isLoading={isLoading}
              onEdit={(course) => setEditingCourse(course)}
            />
          </div>

          {/* Mobile: flat divider list */}
          <div className="lg:hidden">
            <CoursesList
              courses={courses}
              isLoading={isLoading}
              onEdit={(course) => setEditingCourse(course)}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
