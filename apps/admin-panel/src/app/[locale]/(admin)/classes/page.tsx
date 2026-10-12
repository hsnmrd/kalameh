"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { ClassDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { classesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
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

  const [termId, setTermId] = React.useState("")
  const [courseId, setCourseId] = React.useState("")
  const [search, setSearch] = React.useState("")

  const { data: classes, isLoading } = useQuery({
    ...classesResource.list.toQuery({
      instituteId: activeInstituteId,
      termId: termId || undefined,
      courseId: courseId || undefined,
      search: search || undefined,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

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
              termId={termId}
              onTermChange={setTermId}
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
