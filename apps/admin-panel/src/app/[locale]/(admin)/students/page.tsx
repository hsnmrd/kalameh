"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations, useLocale } from "next-intl"
import type { StudentDto } from "@workspace/types"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  parseStatusFilter,
} from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  coursesResource,
  operatingPhasesResource,
  studentsResource,
  API_BASE_URL,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { StudentsHeaderActions } from "./components/students-header-actions"
import { NoOperatingPhaseAlert } from "./components/no-operating-phase-alert"
import { StudentsFilter } from "./components/students-filter"
import { StudentsTable } from "./components/students-table"
import { StudentsList } from "./components/students-list"
import { StudentsFabDrawer } from "./components/students-fab-drawer"

export default function StudentsPage() {
  const t = useTranslations("students")
  const locale = useLocale()
  const { openModal } = useModal()

  const [searchValue, setSearchValue] = React.useState("")
  const [selectedCourseId, setSelectedCourseId] = React.useState("ALL")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")
  const [isExporting, setIsExporting] = React.useState(false)

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.STUDENTS)

  // Fetch operating phases to verify institute has at least one active phase
  const { data: operatingPhases = [], isLoading: isLoadingPhases } = useQuery({
    ...operatingPhasesResource.list.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const hasNoPhases = !isLoadingPhases && operatingPhases.length === 0

  // Fetch list of courses for course filter & modal selection
  const { data: courses = [] } = useQuery({
    ...coursesResource.list.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId && hasModule && !hasNoPhases),
  })

  // Query students
  const { data: students, isLoading } = useQuery({
    ...studentsResource.list.toQuery({
      search: searchValue.trim() || undefined,
      courseId: selectedCourseId !== "ALL" ? selectedCourseId : undefined,
      isActive: parseStatusFilter(selectedStatus),
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule && !hasNoPhases),
  })

  const totalCount = students?.length ?? 0
  const isListEmpty = !isLoading && !hasNoPhases && totalCount === 0

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const baseUrl = API_BASE_URL
      const queryParams = new URLSearchParams()
      const isActiveFilter = parseStatusFilter(selectedStatus)
      if (isActiveFilter !== undefined)
        queryParams.set("isActive", String(isActiveFilter))
      if (selectedCourseId !== "ALL")
        queryParams.set("courseId", selectedCourseId)
      if (searchValue.trim()) queryParams.set("search", searchValue.trim())
      if (activeInstituteId) queryParams.set("instituteId", activeInstituteId)

      const url = `${baseUrl}/students/export-excel?${queryParams.toString()}`
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
      a.download = "students-list.xlsx"
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

  const handleCreate = () => openModal("createStudent")
  const handleImport = () => openModal("importStudents")
  const handleSetAllAvailable = () => openModal("setAllAvailable")
  const handleEdit = (student: StudentDto) =>
    openModal("editStudent", { student })
  const handleViewProfile = (student: StudentDto) =>
    openModal("profileStudent", { student })
  const handleAvailability = (student: StudentDto) =>
    openModal("availabilityStudent", { student })
  const handleAddNote = (student: StudentDto) =>
    openModal("addNote", { student })
  const handleResetPassword = (student: StudentDto) =>
    openModal("resetPassword", { student })

  return (
    <ModuleGuard module={APP_MODULES.STUDENTS}>
      <PermissionGuard permission={PERMISSIONS.VIEW_STUDENTS} mode="forbidden">
        <AdminPageShell
          actions={
            <StudentsHeaderActions
              totalCount={totalCount}
              onImportClick={handleImport}
              onExportClick={handleExport}
              isExporting={isExporting}
            />
          }
          filter={
            <StudentsFilter
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              selectedCourseId={selectedCourseId}
              onCourseChange={setSelectedCourseId}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              courses={courses}
              onAddClick={isListEmpty ? undefined : handleCreate}
              onSetAllAvailableClick={
                isListEmpty ? undefined : handleSetAllAvailable
              }
              disabled={isLoadingPhases || hasNoPhases}
            />
          }
          modals={
            !hasNoPhases && !isLoadingPhases ? (
              <ModalGateway
                registry={modalRegistry}
                extraProps={{
                  instituteId: activeInstituteId,
                  operatingPhases,
                  onAvailability: handleAvailability,
                  onEdit: handleEdit,
                  onAddNote: handleAddNote,
                  onResetPassword: handleResetPassword,
                }}
              />
            ) : null
          }
          fab={
            !hasNoPhases && !isLoadingPhases && !isListEmpty ? (
              <StudentsFabDrawer
                onAddClick={handleCreate}
                onSetAllAvailableClick={handleSetAllAvailable}
              />
            ) : null
          }
        >
          {isLoadingPhases ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : hasNoPhases ? (
            <NoOperatingPhaseAlert />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <StudentsTable
                  students={students}
                  isLoading={isLoading}
                  onViewProfile={handleViewProfile}
                  onAddNote={handleAddNote}
                  onEdit={handleEdit}
                  onResetPassword={handleResetPassword}
                  onAvailability={handleAvailability}
                  onAdd={handleCreate}
                />
              </div>

              {/* Mobile Flat List View */}
              <div className="flex flex-1 flex-col lg:hidden">
                <StudentsList
                  students={students}
                  isLoading={isLoading}
                  onViewProfile={handleViewProfile}
                  onAddNote={handleAddNote}
                  onEdit={handleEdit}
                  onResetPassword={handleResetPassword}
                  onAvailability={handleAvailability}
                  onAdd={handleCreate}
                />
              </div>
            </>
          )}
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
