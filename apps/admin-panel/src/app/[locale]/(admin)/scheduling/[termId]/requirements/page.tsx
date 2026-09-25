"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  APP_MODULES,
  PERMISSIONS,
  type ClassRequirementDto,
  type ClassRequirementInput,
  type UpdateClassRequirementInput,
} from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { AdminPageShell } from "@/components/admin-page-shell"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import {
  classRequirementsResource,
  classesResource,
  schedulingResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { RequirementsFilter } from "./components/requirements-filter"
import { RequirementsTable } from "./components/requirements-table"
import { RequirementsList } from "./components/requirements-list"
import { CreateRequirementModal } from "./components/create-requirement-modal"
import { EditRequirementModal } from "./components/edit-requirement-modal"
import { DeleteRequirementModal } from "./components/delete-requirement-modal"
import { SyncDemandModal } from "./components/sync-demand-modal"

export default function TermRequirementsPage() {
  const t = useTranslations("scheduling")
  const params = useParams()
  const termId = (params.termId as string) || ""
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const [branchId, setBranchId] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isSyncOpen, setIsSyncOpen] = React.useState(false)
  const [editingItem, setEditingItem] =
    React.useState<ClassRequirementDto | null>(null)
  const [deletingItem, setDeletingItem] =
    React.useState<ClassRequirementDto | null>(null)

  const termsQuery = useQuery({
    ...schedulingResource.terms.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })

  const currentTerm = React.useMemo(
    () => termsQuery.data?.find((term) => term.id === termId),
    [termsQuery.data, termId]
  )

  const requirementsQuery = useQuery({
    ...classRequirementsResource.list.toQuery({
      termId,
      branchId: branchId && branchId !== "all" ? branchId : undefined,
      instituteId: activeInstituteId || undefined,
    }),
    enabled: Boolean(termId && activeInstituteId),
  })

  const createMutation = useMutation({
    ...classRequirementsResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("requirementsPage.createSuccess"))
      setIsCreateOpen(false)
      queryClient.invalidateQueries({
        queryKey: classRequirementsResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: schedulingResource.terms.baseKey(),
      })
    },
  })

  const updateMutation = useMutation({
    ...classRequirementsResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("requirementsPage.updateSuccess"))
      setEditingItem(null)
      queryClient.invalidateQueries({
        queryKey: classRequirementsResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: schedulingResource.terms.baseKey(),
      })
    },
  })

  const deleteMutation = useMutation({
    ...classRequirementsResource.deactivate.toMutation(),
    onSuccess: () => {
      toast.success(t("requirementsPage.deleteSuccess"))
      setDeletingItem(null)
      queryClient.invalidateQueries({
        queryKey: classRequirementsResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: schedulingResource.terms.baseKey(),
      })
    },
  })

  const calculateMutation = useMutation({
    ...schedulingResource.calculateDemand.toMutation(),
  })

  const applyMutation = useMutation({
    ...schedulingResource.applyDemand.toMutation(),
    onSuccess: (result) => {
      toast.success(
        t("requirementsPage.syncDemandSuccess", {
          count: result.totalRequirements,
        })
      )
      setIsSyncOpen(false)
      queryClient.invalidateQueries({
        queryKey: classRequirementsResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: classesResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: schedulingResource.terms.baseKey(),
      })
    },
  })

  const handleSyncDemand = () => {
    if (!termId) return
    calculateMutation.mutate(
      {
        termId,
        branchId: branchId && branchId !== "all" ? branchId : undefined,
        instituteId: activeInstituteId || undefined,
        defaultCapacity: 14,
      },
      {
        onSuccess: (data) => {
          const eligibleCourses = (data?.courses ?? []).filter(
            (c) => c.suggestedClassCount > 0
          )

          if (eligibleCourses.length === 0) {
            toast.error(t("demand.emptyDemand"))
            setIsSyncOpen(false)
            return
          }

          applyMutation.mutate({
            termId,
            branchId: branchId && branchId !== "all" ? branchId : undefined,
            instituteId: activeInstituteId || undefined,
            items: eligibleCourses.map((c) => ({
              courseId: c.courseId,
              requiredClassCount: Math.max(1, c.suggestedClassCount),
              capacity: Math.max(1, c.suggestedCapacity || 14),
              deliveryMode:
                c.suggestedOnlineCount > c.suggestedInPersonCount
                  ? "ONLINE"
                  : "IN_PERSON",
              sessionDurationMinutes: 90,
              sessionsPerWeek: c.sessionsPerWeek ?? 3,
            })),
          })
        },
      }
    )
  }

  const handleCreate = (data: ClassRequirementInput) => {
    createMutation.mutate({
      body: data,
      instituteId: activeInstituteId || undefined,
    })
  }

  const handleUpdate = (id: string, data: UpdateClassRequirementInput) => {
    updateMutation.mutate({
      id,
      body: data,
      instituteId: activeInstituteId || undefined,
    })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate({
      id,
      instituteId: activeInstituteId || undefined,
    })
  }

  const filteredItems = React.useMemo(() => {
    const list = requirementsQuery.data ?? []
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter((item) => item.course?.title?.toLowerCase().includes(q))
  }, [requirementsQuery.data, search])

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell
          breadcrumb={
            <AdminBreadcrumb
              backHref={`/scheduling/${termId}`}
              backLabel={t("requirementsPage.actions.backToScheduling")}
              items={[
                { label: t("title"), href: "/scheduling" },
                {
                  label: currentTerm?.title ?? "...",
                  href: `/scheduling/${termId}`,
                },
                { label: t("requirementsPage.title") },
              ]}
            />
          }
          filter={
            <RequirementsFilter
              search={search}
              onSearchChange={setSearch}
              branchId={branchId}
              onBranchChange={setBranchId}
              onAddClick={() => setIsCreateOpen(true)}
              onSyncDemandClick={() => setIsSyncOpen(true)}
              isSyncing={calculateMutation.isPending || applyMutation.isPending}
            />
          }
          fab={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_CLASSES}
              mode="hide"
            >
              <FABSingle
                onClick={() => setIsCreateOpen(true)}
                aria-label={t("requirementsPage.addRequirement")}
              >
                <Plus className="size-6" aria-hidden />
              </FABSingle>
            </PermissionGuard>
          }
        >
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <RequirementsTable
              items={filteredItems}
              isLoading={requirementsQuery.isLoading}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
            />
          </div>

          {/* Mobile: MobileList */}
          <div className="lg:hidden">
            <RequirementsList
              items={filteredItems}
              isLoading={requirementsQuery.isLoading}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
            />
          </div>

          <CreateRequirementModal
            termId={termId}
            open={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSave={handleCreate}
            isSaving={createMutation.isPending}
          />

          <EditRequirementModal
            item={editingItem}
            open={Boolean(editingItem)}
            onClose={() => setEditingItem(null)}
            onSave={handleUpdate}
            isSaving={updateMutation.isPending}
          />

          <DeleteRequirementModal
            item={deletingItem}
            open={Boolean(deletingItem)}
            onClose={() => setDeletingItem(null)}
            onConfirm={handleDelete}
            isDeleting={deleteMutation.isPending}
          />

          <SyncDemandModal
            open={isSyncOpen}
            onClose={() => setIsSyncOpen(false)}
            onConfirm={handleSyncDemand}
            isSyncing={calculateMutation.isPending || applyMutation.isPending}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
