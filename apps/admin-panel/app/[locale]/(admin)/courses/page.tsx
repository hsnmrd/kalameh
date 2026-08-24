"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { CourseDto } from "@workspace/types"
import { PERMISSIONS } from "@workspace/types"
import { coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { CoursesHeader } from "./components/courses-header"
import { CoursesTable } from "./components/courses-table"
import { CreateCourseModal } from "./components/create-course-modal"
import { EditCourseModal } from "./components/edit-course-modal"

export default function CoursesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingCourse, setEditingCourse] = React.useState<CourseDto | null>(
    null
  )

  const { activeInstituteId } = useActiveInstitute()

  const { data: courses, isLoading } = useQuery({
    ...coursesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: !!activeInstituteId,
  })

  return (
    <PermissionGuard permission={PERMISSIONS.VIEW_COURSES} mode="forbidden">
      <AdminPageShell
        header={<CoursesHeader onAddCourse={() => setCreateModalOpen(true)} />}
        modals={
          <>
            <CreateCourseModal
              open={createModalOpen}
              onClose={() => setCreateModalOpen(false)}
            />

            <EditCourseModal
              course={editingCourse}
              open={Boolean(editingCourse)}
              onClose={() => setEditingCourse(null)}
            />
          </>
        }
      >
        <CoursesTable
          courses={courses}
          isLoading={isLoading}
          onEdit={(course) => setEditingCourse(course)}
        />
      </AdminPageShell>
    </PermissionGuard>
  )
}
