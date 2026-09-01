"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { GraduationCap, Edit2, KeyRound, Eye, FileText } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type StudentDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { StudentStatusBadge } from "../student-status-badge"
import { StudentCard } from "../student-card"

export interface StudentsTableProps {
  students: StudentDto[] | undefined
  isLoading: boolean
  onViewProfile: (student: StudentDto) => void
  onAddNote: (student: StudentDto) => void
  onEdit: (student: StudentDto) => void
  onResetPassword: (student: StudentDto) => void
}

export function StudentsTable({
  students,
  isLoading,
  onViewProfile,
  onAddNote,
  onEdit,
  onResetPassword,
}: StudentsTableProps) {
  const t = useTranslations("students")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<StudentDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("table.name"),
        cell: ({ row }) => {
          const student = row.original
          const initials = `${student.firstName[0] || ""}${student.lastName[0] || ""}`
          const fullName = `${student.firstName} ${student.lastName}`
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {student.avatarUrl ? (
                  <Image
                    src={getAssetUrl(student.avatarUrl)}
                    alt={fullName}
                    width={36}
                    height={36}
                    className="size-9 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {fullName}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {student.phone}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "fatherName",
        header: t("table.fatherName"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground/90">
            {row.original.studentProfile?.fatherName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "nationalCode",
        header: t("table.nationalCode"),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.nationalCode ? row.original.nationalCode : "—"}
          </span>
        ),
      },
      {
        accessorKey: "currentLevel",
        header: t("table.currentLevel"),
        cell: ({ row }) => {
          const course = row.original.currentAllowedCourse
          return course ? (
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 text-primary"
            >
              <GraduationCap className="size-3" />
              <span>{course.title}</span>
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("table.noLevel")}
            </span>
          )
        },
      },
      {
        accessorKey: "isActive",
        header: t("table.status"),
        cell: ({ row }) => (
          <StudentStatusBadge isActive={row.original.isActive} />
        ),
      },
      {
        accessorKey: "createdAt",
        header: t("table.createdAt"),
        cell: ({ row }) => {
          try {
            const date = new Date(row.original.createdAt)
            return (
              <span className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(
                  locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                ).format(date)}
              </span>
            )
          } catch {
            return (
              <span className="text-xs text-muted-foreground">
                {String(row.original.createdAt)}
              </span>
            )
          }
        },
      },
      {
        id: "actions",
        header: () => <div className="text-end">{t("table.actions")}</div>,
        cell: ({ row }) => {
          const student = row.original
          return (
            <div className="flex items-center justify-end gap-1.5">
              <PermissionGuard
                permission={PERMISSIONS.VIEW_STUDENTS}
                mode="disable"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onViewProfile(student)}
                  title={t("actions.viewProfile")}
                  className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Eye className="size-3.5" />
                </Button>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_STUDENT_NOTES}
                mode="disable"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onAddNote(student)}
                  title={t("actions.addNote")}
                  className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <FileText className="size-3.5" />
                </Button>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_STUDENTS}
                mode="disable"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onResetPassword(student)}
                  title={t("actions.resetPassword")}
                  className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <KeyRound className="size-3.5" />
                </Button>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_STUDENTS}
                mode="disable"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(student)}
                  title={t("actions.edit")}
                  className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Edit2 className="size-3.5" />
                </Button>
              </PermissionGuard>
            </div>
          )
        },
      },
    ],
    [locale, onAddNote, onEdit, onResetPassword, onViewProfile, t]
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!students || students.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <GraduationCap className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={students}
      emptyMessage={t("table.empty")}
    />
  )
}
