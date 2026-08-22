"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { CourseDto } from "@workspace/types"
import { coursesResource } from "@/lib/api"
import { CoursesHeader } from "./components/courses-header"
import { CoursesTable } from "./components/courses-table"
import { CreateCourseModal } from "./components/create-course-modal"
import { EditCourseModal } from "./components/edit-course-modal"

export default function CoursesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingCourse, setEditingCourse] = React.useState<CourseDto | null>(
    null
  )

  const { data: courses, isLoading } = useQuery(coursesResource.list.toQuery())

  return (
    <div className="space-y-6">
      <CoursesHeader onAddCourse={() => setCreateModalOpen(true)} />

      <CoursesTable
        courses={courses}
        isLoading={isLoading}
        onEdit={(course) => setEditingCourse(course)}
      />

      <CreateCourseModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <EditCourseModal
        course={editingCourse}
        open={Boolean(editingCourse)}
        onClose={() => setEditingCourse(null)}
      />
    </div>
  )
}
