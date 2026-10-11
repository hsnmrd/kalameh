"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  Eye,
  Edit,
  KeyRound,
  GraduationCap,
  FileText,
  Clock,
  Plus,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  MobileList,
  MobileListItem,
  MobileListItemIcon,
  MobileListItemContent,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@workspace/ui/components/context-menu"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type StudentDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { StudentScheduleStatusBadge } from "../student-schedule-status-badge"

export interface StudentsListProps {
  students: StudentDto[] | undefined
  isLoading: boolean
  onViewProfile: (student: StudentDto) => void
  onAddNote: (student: StudentDto) => void
  onEdit: (student: StudentDto) => void
  onResetPassword: (student: StudentDto) => void
  onAvailability?: (student: StudentDto) => void
  onAdd?: () => void
}

export function StudentsList({
  students,
  isLoading,
  onViewProfile,
  onAddNote,
  onEdit,
  onResetPassword,
  onAvailability,
  onAdd,
}: StudentsListProps) {
  const t = useTranslations("students")

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
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
        {onAdd && (
          <EmptyContent>
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_STUDENTS}
              mode="hide"
            >
              <Button
                type="button"
                onClick={onAdd}
                className="cursor-pointer gap-2"
              >
                <Plus className="size-5" />
                <span>{t("addStudent")}</span>
              </Button>
            </PermissionGuard>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  return (
    <MobileList>
      {students.map((student, index) => {
        const fullName = `${student.firstName} ${student.lastName}`
        const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`

        return (
          <ContextMenu key={student.id}>
            <ContextMenuTrigger>
              <MobileListItem
                onClick={() => onViewProfile(student)}
                isLast={index === students.length - 1}
              >
                <div className="relative shrink-0">
                  <MobileListItemIcon>
                    {student.avatarUrl ? (
                      <Image
                        src={getAssetUrl(student.avatarUrl)}
                        alt={fullName}
                        width={44}
                        height={44}
                        className="size-11 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs font-semibold text-foreground">
                        {initials}
                      </span>
                    )}
                  </MobileListItemIcon>
                  {!student.isActive && (
                    <span
                      className="absolute end-0 bottom-0 size-3.5 rounded-full bg-destructive ring-2 ring-background"
                      aria-label={t("status.inactive")}
                      title={t("status.inactive")}
                    />
                  )}
                </div>

                <MobileListItemContent
                  primary={fullName}
                  secondary={
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span>{student.phone}</span>
                      {student.branch && (
                        <>
                          <span>•</span>
                          <span className="font-sans">
                            {student.branch.name}
                          </span>
                        </>
                      )}
                    </div>
                  }
                />

                <MobileListItemTrailing>
                  <StudentScheduleStatusBadge
                    scheduleStatus={student.studentProfile?.scheduleStatus}
                  />
                  {student.currentAllowedCourse ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/30 bg-primary/10 text-[11px] text-primary"
                    >
                      <GraduationCap className="size-3 text-inherit" />
                      <span className="max-w-[120px] truncate sm:max-w-none">
                        {student.currentAllowedCourse.title}
                      </span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-muted-foreground/30 bg-muted/40 text-[11px] text-muted-foreground"
                    >
                      <span className="max-w-[120px] truncate sm:max-w-none">
                        {t("table.noLevel")}
                      </span>
                    </Badge>
                  )}
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <PermissionGuard
                permission={PERMISSIONS.VIEW_STUDENTS}
                mode="hide"
              >
                <ContextMenuItem onClick={() => onViewProfile(student)}>
                  <Eye className="me-2 size-4 text-muted-foreground" />
                  {t("actions.viewProfile")}
                </ContextMenuItem>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_STUDENT_NOTES}
                mode="hide"
              >
                <ContextMenuItem onClick={() => onAddNote(student)}>
                  <FileText className="me-2 size-4 text-muted-foreground" />
                  {t("actions.addNote")}
                </ContextMenuItem>
              </PermissionGuard>

              {onAvailability && (
                <PermissionGuard
                  permission={PERMISSIONS.MANAGE_STUDENTS}
                  mode="hide"
                >
                  <ContextMenuItem onClick={() => onAvailability(student)}>
                    <Clock className="me-2 size-4 text-muted-foreground" />
                    {t("actions.availability")}
                  </ContextMenuItem>
                </PermissionGuard>
              )}

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_STUDENTS}
                mode="hide"
              >
                <ContextMenuItem onClick={() => onEdit(student)}>
                  <Edit className="me-2 size-4 text-muted-foreground" />
                  {t("actions.edit")}
                </ContextMenuItem>

                <ContextMenuItem onClick={() => onResetPassword(student)}>
                  <KeyRound className="me-2 size-4 text-muted-foreground" />
                  {t("actions.resetPassword")}
                </ContextMenuItem>
              </PermissionGuard>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </MobileList>
  )
}
