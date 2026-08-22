"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { ClassDto } from "@workspace/types"
import { classesResource } from "@/lib/api"
import { ClassesHeader } from "./components/classes-header"
import { ClassesFilter } from "./components/classes-filter"
import { ClassesTable } from "./components/classes-table"
import { CreateClassModal } from "./components/create-class-modal"
import { EditClassModal } from "./components/edit-class-modal"

export default function ClassesPage() {
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [editingClass, setEditingClass] = React.useState<ClassDto | null>(null)

  const [termId, setTermId] = React.useState("")
  const [courseId, setCourseId] = React.useState("")
  const [search, setSearch] = React.useState("")

  const { data: classes, isLoading } = useQuery(
    classesResource.list.toQuery({
      termId: termId || undefined,
      courseId: courseId || undefined,
      search: search || undefined,
    })
  )

  return (
    <div className="space-y-6">
      <ClassesHeader onAddClass={() => setCreateModalOpen(true)} />

      <ClassesFilter
        termId={termId}
        onTermChange={setTermId}
        courseId={courseId}
        onCourseChange={setCourseId}
        search={search}
        onSearchChange={setSearch}
      />

      <ClassesTable
        classes={classes}
        isLoading={isLoading}
        onEdit={(cls) => setEditingClass(cls)}
      />

      <CreateClassModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <EditClassModal
        cls={editingClass}
        open={Boolean(editingClass)}
        onClose={() => setEditingClass(null)}
      />
    </div>
  )
}
