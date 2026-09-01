"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  PERMISSIONS,
  APP_MODULES,
  ROLES,
  parseStatusFilter,
  type ClassroomDto,
} from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { toast } from "@workspace/ui/components/sonner"
import { classroomsResource, branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ClassroomsTable } from "./components/classrooms-table"
import { ClassroomsFilter } from "./components/classrooms-filter"
import { CreateClassroomModal } from "./components/create-classroom-modal"
import { EditClassroomModal } from "./components/edit-classroom-modal"

export default function ClassroomsPage() {
  const t = useTranslations("classrooms")
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingClassroom, setEditingClassroom] =
    React.useState<ClassroomDto | null>(null)
  const [search, setSearch] = React.useState("")
  const [selectedBranchId, setSelectedBranchId] = React.useState("ALL")
  const [selectedStatus, setSelectedStatus] = React.useState("ALL")

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES)

  const { data: branches = [] } = useQuery({
    ...branchesResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const { data: classrooms = [], isLoading } = useQuery({
    ...classroomsResource.list.toQuery({
      instituteId: activeInstituteId,
      branchId: selectedBranchId !== "ALL" ? selectedBranchId : undefined,
      search: search.trim() || undefined,
      isActive: parseStatusFilter(selectedStatus),
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const deleteMutation = useMutation({
    ...classroomsResource.delete.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: classroomsResource.list.baseKey(),
      })
    },
  })

  const handleDelete = (classroom: ClassroomDto) => {
    if (confirm(`${classroom.name} حذف شود؟`)) {
      deleteMutation.mutate(classroom.id)
    }
  }

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard
        permission={PERMISSIONS.VIEW_CLASSROOMS}
        mode="forbidden"
      >
        <AdminPageShell
          filters={
            <ClassroomsFilter
              search={search}
              onSearchChange={setSearch}
              selectedBranchId={selectedBranchId}
              onBranchChange={setSelectedBranchId}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              branches={branches}
              onAddClick={() => setCreateModalOpen(true)}
            />
          }
          modals={
            <>
              <CreateClassroomModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                branches={branches}
              />

              <EditClassroomModal
                classroom={editingClassroom}
                open={Boolean(editingClassroom)}
                onClose={() => setEditingClassroom(null)}
                branches={branches}
              />
            </>
          }
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_CLASSROOMS}
              mode="hide"
            >
              <FABSingle
                onClick={() => setCreateModalOpen(true)}
                aria-label={t("addClassroom")}
              />
            </PermissionGuard>
          }
        >
          <ClassroomsTable
            classrooms={classrooms}
            isLoading={isLoading}
            onEdit={(classroom) => setEditingClassroom(classroom)}
            onDelete={handleDelete}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
