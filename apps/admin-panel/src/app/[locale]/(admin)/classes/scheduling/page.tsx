"use client"

import * as React from "react"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { SchedulingWorkspace } from "./components/scheduling-workspace"

export default function SchedulingPage() {
  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_CLASSES} mode="forbidden">
        <React.Suspense
          fallback={
            <div className="flex min-h-64 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          }
        >
          <SchedulingWorkspace />
        </React.Suspense>
      </PermissionGuard>
    </ModuleGuard>
  )
}
