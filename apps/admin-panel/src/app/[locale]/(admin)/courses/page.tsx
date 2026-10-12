"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { CourseDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { FABSingle } from "@workspace/ui/components/fab"
import { coursesResource, API_BASE_URL } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { CoursesHeaderActions } from "./components/courses-header-actions"
import { CoursesTable } from "./components/courses-table"
import { CoursesList } from "./components/courses-list"
import { CoursesFilter } from "./components/courses-filter"

export default function CoursesPage() {
  const t = useTranslations("courses")
  const locale = useLocale()
  const { openModal } = useModal()

  const [search, setSearch] = React.useState("")
  const [selectedPrerequisiteId, setSelectedPrerequisiteId] =
    React.useState("ALL")
  const [isExporting, setIsExporting] = React.useState(false)

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

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const baseUrl = API_BASE_URL
      const queryParams = new URLSearchParams()
      if (search.trim()) queryParams.set("search", search.trim())
      if (selectedPrerequisiteId !== "ALL")
        queryParams.set("prerequisiteId", selectedPrerequisiteId)
      if (activeInstituteId) queryParams.set("instituteId", activeInstituteId)

      const url = `${baseUrl}/courses/export-excel?${queryParams.toString()}`
      const response = await fetch(url, {
        headers: {
          "Accept-Language": locale,
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to export")
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = "courses-list.xlsx"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch {
      toast.error(t("export.error"))
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreate = () => openModal("createCourse")
  const handleImport = () => openModal("importCourses")
  const handleEdit = (course: CourseDto) => openModal("editCourse", { course })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_COURSES} mode="forbidden">
        <AdminPageShell
          actions={
            <CoursesHeaderActions
              totalCount={courses.length}
              onImportClick={handleImport}
              onExportClick={handleExport}
              isExporting={isExporting}
            />
          }
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
          modals={
            <ModalGateway
              registry={modalRegistry}
              extraProps={{ instituteId: activeInstituteId }}
            />
          }
          fab={
            isListEmpty ? null : (
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_COURSES}
                mode="hide"
              >
                <FABSingle onClick={handleCreate} aria-label={t("addCourse")} />
              </PermissionGuard>
            )
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
