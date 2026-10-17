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
  findCurrentActiveTerm,
} from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  coursesResource,
  operatingPhasesResource,
  studentsResource,
  branchesResource,
  termsResource,
  API_BASE_URL,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal, useUrlFilters } from "@/lib/hooks"
import { useRouter } from "@/i18n/routing"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { TableSkeleton } from "@/components/table-skeleton"
import { ListSkeleton } from "@/components/list-skeleton"
import { modalRegistry } from "./modal"
import { StudentsHeaderActions } from "./components/students-header-actions"
import { StudentScheduleConfirmationBanner } from "./components/student-schedule-confirmation-banner"
import { ClosestTermSignupBanner } from "./components/closest-term-signup-banner"
import { NoOperatingPhaseAlert } from "./components/no-operating-phase-alert"
import { StudentsFilter } from "./components/students-filter"
import { StudentsTable } from "./components/students-table"
import { StudentsList } from "./components/students-list"
import { StudentsFabDrawer } from "./components/students-fab-drawer"

export default function StudentsPage() {
  const router = useRouter()
  const t = useTranslations("students")
  const locale = useLocale()
  const { openModal } = useModal()

  const { filters, setFilter, pageIndex, pageSize, setPageIndex, setPageSize } =
    useUrlFilters({
      defaultValues: {
        searchValue: "",
        selectedCourseId: "ALL",
        selectedBranchId: "ALL",
        selectedStatus: "ALL",
        page: 1,
        pageSize: 10,
      },
      debounceKeys: ["searchValue"],
    })
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

  // Fetch list of branches for branch filter
  const { data: branches = [] } = useQuery({
    ...branchesResource.list.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId && hasModule && !hasNoPhases),
  })

  // Fetch list of terms to check schedule confirmation status
  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId && hasModule && !hasNoPhases),
  })

  const currentActiveTerm = React.useMemo(() => {
    return findCurrentActiveTerm(terms)
  }, [terms])

  // The confirmation banner is specifically for the current active term (or nearest relevant active term).
  // When confirmed for the current active term, it hides.
  const unconfirmedActiveTerm = React.useMemo(() => {
    if (currentActiveTerm) {
      if (Boolean(currentActiveTerm.studentSchedulesConfirmedAt)) {
        return null
      }
      return currentActiveTerm
    }

    return (
      terms.find((term) => {
        if (Boolean(term.studentSchedulesConfirmedAt)) return false
        if (term.isActive === false) return false
        if (
          term.lifecycleStatus === "COMPLETED" ||
          term.lifecycleStatus === "INACTIVE"
        ) {
          return false
        }
        return true
      }) ?? null
    )
  }, [currentActiveTerm, terms])

  const isWishlistFilter = filters.selectedStatus === "WISHLIST"
  const activeStatusFilter = isWishlistFilter
    ? undefined
    : parseStatusFilter(filters.selectedStatus)

  // Query students
  const { data: students, isLoading } = useQuery({
    ...studentsResource.list.toQuery({
      search: filters.searchValue.trim() || undefined,
      courseId:
        filters.selectedCourseId !== "ALL"
          ? filters.selectedCourseId
          : undefined,
      branchId:
        filters.selectedBranchId !== "ALL"
          ? filters.selectedBranchId
          : undefined,
      isActive: activeStatusFilter,
      inWishlist: isWishlistFilter ? true : undefined,
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
      if (isWishlistFilter) {
        queryParams.set("inWishlist", "true")
      } else if (activeStatusFilter !== undefined) {
        queryParams.set("isActive", String(activeStatusFilter))
      }
      if (filters.selectedCourseId !== "ALL")
        queryParams.set("courseId", filters.selectedCourseId)
      if (filters.selectedBranchId !== "ALL")
        queryParams.set("branchId", filters.selectedBranchId)
      if (filters.searchValue.trim())
        queryParams.set("search", filters.searchValue.trim())
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
    router.push(`/students/${student.id}`)
  const handleAvailability = (student: StudentDto) =>
    openModal("availabilityStudent", { student })
  const handleAddNote = (student: StudentDto) =>
    openModal("addNote", { student })
  const handleResetPassword = (student: StudentDto) =>
    openModal("resetPassword", { student })
  const handleConfirmStudentSchedules = (targetTermId?: string) =>
    openModal("confirmStudentSchedules", {
      defaultTermId:
        targetTermId ?? currentActiveTerm?.id ?? unconfirmedActiveTerm?.id,
    })

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
              confirmScheduleLabel={t("confirmStudentSchedules.action")}
              onConfirmScheduleClick={
                terms.length > 0
                  ? () => handleConfirmStudentSchedules(currentActiveTerm?.id)
                  : undefined
              }
            />
          }
          filter={
            <StudentsFilter
              searchValue={filters.searchValue}
              onSearchChange={(search) => setFilter("searchValue", search)}
              selectedCourseId={filters.selectedCourseId}
              onCourseChange={(courseId) =>
                setFilter("selectedCourseId", courseId)
              }
              selectedBranchId={filters.selectedBranchId}
              onBranchChange={(branchId) =>
                setFilter("selectedBranchId", branchId)
              }
              selectedStatus={filters.selectedStatus}
              onStatusChange={(status) => setFilter("selectedStatus", status)}
              courses={courses}
              branches={branches}
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
                  terms,
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
            <div className="flex flex-1 flex-col gap-4">
              {terms.length > 0 && (
                <ClosestTermSignupBanner
                  terms={terms}
                  instituteSettings={{
                    registrationDaysBeforeStart:
                      activeInstitute?.termRegistrationDaysBeforeStart,
                    registrationDaysAfterStart:
                      activeInstitute?.termRegistrationDaysAfterStart,
                    examDaysBeforeEnd: activeInstitute?.termExamDaysBeforeEnd,
                  }}
                  isWishlistActive={isWishlistFilter}
                  onFilterWishlist={() =>
                    setFilter(
                      "selectedStatus",
                      isWishlistFilter ? "ALL" : "WISHLIST"
                    )
                  }
                  onAddStudent={handleCreate}
                />
              )}

              {!isListEmpty && totalCount > 0 && unconfirmedActiveTerm && (
                <StudentScheduleConfirmationBanner
                  term={unconfirmedActiveTerm}
                  studentsCount={totalCount}
                  hasStudents={totalCount > 0}
                  onConfirmClick={() =>
                    handleConfirmStudentSchedules(unconfirmedActiveTerm.id)
                  }
                />
              )}

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <React.Suspense fallback={<TableSkeleton rows={pageSize} />}>
                  <StudentsTable
                    students={students}
                    isLoading={isLoading}
                    onViewProfile={handleViewProfile}
                    onAddNote={handleAddNote}
                    onEdit={handleEdit}
                    onResetPassword={handleResetPassword}
                    onAvailability={handleAvailability}
                    onAdd={handleCreate}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    onPageIndexChange={setPageIndex}
                    onPageSizeChange={setPageSize}
                  />
                </React.Suspense>
              </div>

              {/* Mobile Flat List View */}
              <div className="flex flex-1 flex-col lg:hidden">
                <React.Suspense fallback={<ListSkeleton rows={pageSize} />}>
                  <StudentsList
                    students={students}
                    isLoading={isLoading}
                    onViewProfile={handleViewProfile}
                    onAddNote={handleAddNote}
                    onEdit={handleEdit}
                    onResetPassword={handleResetPassword}
                    onAvailability={handleAvailability}
                    onAdd={handleCreate}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    onPageChange={setPageIndex}
                  />
                </React.Suspense>
              </div>
            </div>
          )}
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
