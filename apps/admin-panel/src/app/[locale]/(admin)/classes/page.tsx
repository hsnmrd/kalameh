"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { ClassDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { classesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ClassesHeader } from "./components/classes-header"
import { ClassesFilter } from "./components/classes-filter"
import { ClassesTable } from "./components/classes-table"
import { CreateClassModal } from "./components/create-class-modal"
import { EditClassModal } from "./components/edit-class-modal"

export default function ClassesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingClass, setEditingClass] = React.useState<ClassDto | null>(null)

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

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          header={<ClassesHeader onAddClass={() => setCreateModalOpen(true)} />}
          filter={
            <ClassesFilter
              termId={termId}
              onTermChange={setTermId}
              courseId={courseId}
              onCourseChange={setCourseId}
              search={search}
              onSearchChange={setSearch}
            />
          }
          modals={
            <>
              <CreateClassModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
              />

              <EditClassModal
                cls={editingClass}
                open={Boolean(editingClass)}
                onClose={() => setEditingClass(null)}
              />
            </>
          }
        >
          <ClassesTable
            classes={classes}
            isLoading={isLoading}
            onEdit={(cls) => setEditingClass(cls)}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
