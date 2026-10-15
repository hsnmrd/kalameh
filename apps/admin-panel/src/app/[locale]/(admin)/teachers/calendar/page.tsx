"use client"

import * as React from "react"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { TableSkeleton } from "@/components/table-skeleton"
import { TeacherCalendarContent } from "./components/teacher-calendar-content"

export default function TeacherCalendarPage() {
  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_TEACHERS} mode="forbidden">
        <React.Suspense fallback={<TableSkeleton rows={5} />}>
          <TeacherCalendarContent />
        </React.Suspense>
      </PermissionGuard>
    </ModuleGuard>
  )
}
