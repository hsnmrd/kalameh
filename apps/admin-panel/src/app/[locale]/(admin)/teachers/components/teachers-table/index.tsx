"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Edit2, KeyRound, Eye, Trash2, MoreVertical, Clock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type TeacherDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { TeachersTableEmptyState } from "./empty-state"

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
  const t = useTranslations("teachers")

  const columns = React.useMemo<ColumnDef<TeacherDto>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("table.name"),
        cell: ({ row }) => {
          const teacher = row.original
          const initials = `${teacher.firstName[0] || ""}${teacher.lastName[0] || ""}`
          const fullName = `${teacher.firstName} ${teacher.lastName}`
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {teacher.avatarUrl ? (
                  <Image
                    src={getAssetUrl(teacher.avatarUrl)}
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
                  {teacher.phone}
                </span>
              </div>
            </div>
          )
        },
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
        accessorKey: "degree",
        header: t("table.degree"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground/90">
            {row.original.teacherProfile?.degree || "—"}
          </span>
        ),
      },
      {
        accessorKey: "availabilities",
        header: t("table.availabilities"),
        cell: ({ row }) => {
          const teacher = row.original
          const count = teacher.teacherProfile?.availabilities?.length || 0
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onManageAvailability(teacher)}
              className="h-8 gap-1.5 px-2.5 font-normal text-muted-foreground hover:text-foreground"
              title={t("actions.manageAvailability")}
            >
              <Clock className="size-3.5 text-muted-foreground" />
              <span>
                {count > 0
                  ? t("availabilities.slotsCount", { count })
                  : t("table.setAvailability")}
              </span>
            </Button>
          )
        },
      },
      {
        accessorKey: "classesCount",
        header: t("table.classesCount"),
        cell: ({ row }) => (
          <span className="font-mono text-sm text-foreground">
            {row.original.classesCount ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: t("table.status"),
        cell: ({ row }) => {
          const isActive = row.original.isActive
          return (
            <Badge
              variant={isActive ? "outline" : "secondary"}
              className={
                isActive
                  ? "border-success/30 bg-success/10 text-success"
                  : "text-muted-foreground"
              }
            >
              {isActive ? t("status.active") : t("status.inactive")}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => {
          const teacher = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onViewProfile(teacher)}
                className="text-muted-foreground hover:text-foreground"
                title={t("actions.viewProfile")}
                aria-label={t("actions.viewProfile")}
              >
                <Eye className="size-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t("table.actions")}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <PermissionGuard
                    permission={PERMISSIONS.MANAGE_TEACHERS}
                    mode="hide"
                  >
                    <DropdownMenuItem
                      onClick={() => onManageAvailability(teacher)}
                      className="gap-2"
                    >
                      <Clock className="size-4 text-muted-foreground" />
                      <span>{t("actions.manageAvailability")}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onEdit(teacher)}
                      className="gap-2"
                    >
                      <Edit2 className="size-4 text-muted-foreground" />
                      <span>{t("actions.edit")}</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => onResetPassword(teacher)}
                      className="gap-2"
                    >
                      <KeyRound className="size-4 text-muted-foreground" />
                      <span>{t("actions.resetPassword")}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => onDelete(teacher)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4 text-destructive" />
                      <span>{t("actions.delete")}</span>
                    </DropdownMenuItem>
                  </PermissionGuard>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [t, onViewProfile, onEdit, onManageAvailability, onResetPassword, onDelete]
  )

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
