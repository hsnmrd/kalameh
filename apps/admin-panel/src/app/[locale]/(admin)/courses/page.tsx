"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { CourseDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { CoursesTable } from "./components/courses-table"
import { CoursesList } from "./components/courses-list"
import { CoursesFilter } from "./components/courses-filter"

export default function CoursesPage() {
  const t = useTranslations("courses")
  const { openModal } = useModal()

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

  const isListEmpty = !isLoading && courses.length === 0

  const handleCreate = () => openModal("createCourse")
  const handleEdit = (course: CourseDto) => openModal("editCourse", { course })

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
              onAddClick={isListEmpty ? undefined : handleCreate}
            />
          }
          modals={<ModalGateway registry={modalRegistry} />}
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_COURSES}
              mode="hide"
            >
              <FABSingle onClick={handleCreate} aria-label={t("addCourse")} />
            </PermissionGuard>
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <CoursesTable
              courses={courses}
              isLoading={isLoading}
              onEdit={handleEdit}
              onAdd={handleCreate}
            />
          </div>

          {/* Mobile: flat divider list */}
          <div className="flex flex-1 flex-col lg:hidden">
            <CoursesList
              courses={courses}
              isLoading={isLoading}
              onEdit={handleEdit}
              onAdd={handleCreate}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
