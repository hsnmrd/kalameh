"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { ClassDto } from "@workspace/types"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  findCurrentActiveTerm,
} from "@workspace/types"
import { classesResource, termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal, useUrlFilters } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { TableSkeleton } from "@/components/table-skeleton"
import { ListSkeleton } from "@/components/list-skeleton"
import { modalRegistry } from "./modal"
import { useRouter } from "@/i18n/routing"
import { ClassesFilter } from "./components/classes-filter"
import { ClassesTable } from "./components/classes-table"
import { ClassesList } from "./components/classes-list"
import { ClassesFabDrawer } from "./components/classes-fab-drawer"

export default function ClassesPage() {
  const router = useRouter()
  const { openModal } = useModal()
  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { filters, setFilter, pageIndex, pageSize, setPageIndex, setPageSize } =
    useUrlFilters({
      defaultValues: {
        search: "",
        termId: "",
        courseId: "",
        page: 1,
        pageSize: 10,
      },
      debounceKeys: ["search"],
    })

  // Reset user selection when active institute changes so the new institute's active term is used
  const prevInstituteIdRef = React.useRef(activeInstituteId)
  React.useEffect(() => {
    if (prevInstituteIdRef.current !== activeInstituteId) {
      prevInstituteIdRef.current = activeInstituteId
      setFilter("termId", "")
    }
  }, [activeInstituteId, setFilter])

  const { data: terms, isLoading: isLoadingTerms } = useQuery({
    ...termsResource.list.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const currentActiveTerm = React.useMemo(() => {
    return findCurrentActiveTerm(terms)
  }, [terms])

  const effectiveTermId = React.useMemo(() => {
    if (filters.termId) {
      return filters.termId === "all" ? "" : filters.termId
    }
    return currentActiveTerm?.id ?? ""
  }, [filters.termId, currentActiveTerm])

  // When no explicit term filter is set yet, wait for terms query to discover the active term
  // to avoid a wasteful initial request that fetches all classes across all terms.
  const isWaitingForDefaultTerm = !filters.termId && isLoadingTerms

  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    ...classesResource.list.toQuery({
      instituteId: activeInstituteId,
      termId: effectiveTermId || undefined,
      courseId: filters.courseId || undefined,
      search: filters.search || undefined,
    }),
    enabled: Boolean(
      activeInstituteId && hasModule && !isWaitingForDefaultTerm
    ),
  })

  const isLoading = isWaitingForDefaultTerm || isLoadingClasses
  const isListEmpty = !isLoading && (!classes || classes.length === 0)

  const handleCreate = () => openModal("createClass")
  const handleScheduling = () => router.push("/classes/scheduling")
  const handleEdit = (cls: ClassDto) => openModal("editClass", { cls })
  const handleViewDetails = (cls: ClassDto) =>
    openModal("classDetails", { cls })
  const handleDelete = (cls: ClassDto) => openModal("deleteClass", { cls })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          filter={
            <ClassesFilter
              termId={effectiveTermId}
              onTermChange={(termId) => setFilter("termId", termId)}
              courseId={filters.courseId}
              onCourseChange={(courseId) => setFilter("courseId", courseId)}
              search={filters.search}
              onSearchChange={(search) => setFilter("search", search)}
              onAddClick={isListEmpty ? undefined : handleCreate}
            />
          }
          modals={
            <ModalGateway
              registry={modalRegistry}
              extraProps={{
                onEdit: handleEdit,
                onDelete: handleDelete,
              }}
            />
          }
          fab={
            isListEmpty ? null : <ClassesFabDrawer onAddClick={handleCreate} />
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <React.Suspense fallback={<TableSkeleton rows={pageSize} />}>
              <ClassesTable
                classes={classes}
                isLoading={isLoading}
                onEdit={handleEdit}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
                onAdd={handleCreate}
                onScheduling={handleScheduling}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </React.Suspense>
          </div>

          {/* Mobile: flat divider list */}
          <div className="flex flex-1 flex-col lg:hidden">
            <React.Suspense fallback={<ListSkeleton rows={pageSize} />}>
              <ClassesList
                classes={classes}
                isLoading={isLoading}
                onEdit={handleEdit}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
                onAdd={handleCreate}
                onScheduling={handleScheduling}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
              />
            </React.Suspense>
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
