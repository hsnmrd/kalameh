"use client"

import { useLocale } from "next-intl"
import { TableSkeleton } from "@/components/table-skeleton"
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
  onAdd?: () => void
  pageIndex?: number
  pageSize?: number
  onPageIndexChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function TeachersTable({
  teachers,
  isLoading,
  onViewProfile,
  onEdit,
  onManageAvailability,
  onResetPassword,
  onDelete,
  onAdd,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
}: TeachersTableProps) {
  const locale = useLocale()
  const columns = useTeachersTableColumns({
    onViewProfile,
    onEdit,
    onManageAvailability,
    onResetPassword,
    onDelete,
  })

  if (isLoading) {
    return <TableSkeleton rows={pageSize ?? 5} />
  }

  if (!teachers || teachers.length === 0) {
    return <TeachersTableEmptyState onAdd={onAdd} />
  }

  return (
    <DataTable
      columns={columns}
      data={teachers}
      pagination={{ pageSize: pageSize ?? 10 }}
      pageIndex={pageIndex}
      onPageIndexChange={onPageIndexChange}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
      locale={locale}
    />
  )
}
