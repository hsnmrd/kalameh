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
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { useRouter } from "@/i18n/routing"
import { useSearchParams } from "next/navigation"
import { ClassesFilter } from "./components/classes-filter"
import { ClassesTable } from "./components/classes-table"
import { ClassesList } from "./components/classes-list"
import { ClassesFabDrawer } from "./components/classes-fab-drawer"

export default function ClassesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTermParam = searchParams?.get("termId")
  const { openModal } = useModal()
  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  // Track explicit user selection. If null, automatically falls back to current active term.
  const [userSelectedTermId, setUserSelectedTermId] = React.useState<
    string | null
  >(
    initialTermParam !== null && initialTermParam !== undefined
      ? initialTermParam
      : null
  )
  const [courseId, setCourseId] = React.useState("")
  const [search, setSearch] = React.useState("")

  // Reset user selection when active institute changes so the new institute's active term is used
  const prevInstituteIdRef = React.useRef(activeInstituteId)
  React.useEffect(() => {
    if (prevInstituteIdRef.current !== activeInstituteId) {
      prevInstituteIdRef.current = activeInstituteId
      setUserSelectedTermId(null)
    }
  }, [activeInstituteId])

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
    if (userSelectedTermId !== null) {
      return userSelectedTermId === "all" ? "" : userSelectedTermId
    }
    return currentActiveTerm?.id ?? ""
  }, [userSelectedTermId, currentActiveTerm])

  // When no explicit term filter is set yet, wait for terms query to discover the active term
  // to avoid a wasteful initial request that fetches all classes across all terms.
  const isWaitingForDefaultTerm = userSelectedTermId === null && isLoadingTerms

  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    ...classesResource.list.toQuery({
      instituteId: activeInstituteId,
      termId: effectiveTermId || undefined,
      courseId: courseId || undefined,
      search: search || undefined,
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
              onTermChange={setUserSelectedTermId}
              courseId={courseId}
              onCourseChange={setCourseId}
              search={search}
              onSearchChange={setSearch}
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
            <ClassesTable
              classes={classes}
              isLoading={isLoading}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onDelete={handleDelete}
              onAdd={handleCreate}
              onScheduling={handleScheduling}
            />
          </div>

          {/* Mobile: flat divider list */}
          <div className="flex flex-1 flex-col lg:hidden">
            <ClassesList
              classes={classes}
              isLoading={isLoading}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onDelete={handleDelete}
              onAdd={handleCreate}
              onScheduling={handleScheduling}
            />
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
