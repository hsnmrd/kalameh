"use client"

import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import type { TeacherDto } from "@workspace/types"
import { TeachersTableEmptyState } from "./empty-state"
import { useTeachersTableColumns } from "./hooks/use-teachers-table-columns"

export interface TeachersTableProps {
  teachers: TeacherDto[] | undefined
  isLoading: boolean
  onViewProfile: (teacher: TeacherDto) => void
  onEdit: (teacher: TeacherDto) => void
  onManageAvailability: (teacher: TeacherDto) => void
  onResetPassword: (teacher: TeacherDto) => void
  onDelete: (teacher: TeacherDto) => void
}

export function TeachersTable({
  teachers,
  isLoading,
  onViewProfile,
  onEdit,
  onManageAvailability,
  onResetPassword,
  onDelete,
}: TeachersTableProps) {
  const columns = useTeachersTableColumns({
    onViewProfile,
    onEdit,
    onManageAvailability,
    onResetPassword,
    onDelete,
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!teachers || teachers.length === 0) {
    return <TeachersTableEmptyState />
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <DataTable columns={columns} data={teachers} />
    </div>
  )
}
