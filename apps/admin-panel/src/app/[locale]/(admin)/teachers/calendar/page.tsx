"use client"

import * as React from "react"
import { APP_MODULES, PERMISSIONS } from "@workspace/types"
import { ModuleGuard } from "@/components/module-guard"
import { PermissionGuard } from "@/components/permission-guard"
import { TeacherCalendarContent } from "./components/teacher-calendar-content"

export default function TeacherCalendarPage() {
  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_TEACHERS} mode="forbidden">
        <TeacherCalendarContent />
      </PermissionGuard>
    </ModuleGuard>
  )
}
