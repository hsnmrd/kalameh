"use client"

import * as React from "react"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { TableSkeleton } from "@/components/table-skeleton"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { SchedulingWorkspace } from "./components/scheduling-workspace"

export default function SchedulingPage() {
  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <React.Suspense fallback={<TableSkeleton rows={5} />}>
          <SchedulingWorkspace />
        </React.Suspense>
      </PermissionGuard>
    </ModuleGuard>
  )
}
