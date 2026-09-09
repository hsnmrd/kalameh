"use client"

import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { AdminPageShell } from "@/components/admin-page-shell"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { SchedulingWorkspace } from "./components/scheduling-workspace"

export default function SchedulingPage() {
  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <AdminPageShell>
          <SchedulingWorkspace />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
