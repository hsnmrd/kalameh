"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Eye, Edit, KeyRound, GraduationCap } from "lucide-react"
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
} from "@workspace/ui/components/empty"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type StudentDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { StudentStatusBadge } from "../student-status-badge"

export interface StudentsListProps {
  students: StudentDto[] | undefined
  isLoading: boolean
  onViewProfile: (student: StudentDto) => void
  onEdit: (student: StudentDto) => void
  onResetPassword: (student: StudentDto) => void
}

export function StudentsList({
  students,
  isLoading,
  onViewProfile,
  onEdit,
  onResetPassword,
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

                <MobileListItemContent
                  primary={fullName}
                  secondary={
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span>{student.phone}</span>
                      {student.currentAllowedCourse && (
                        <>
                          <span>•</span>
                          <span className="font-sans">
                            {student.currentAllowedCourse.title}
                          </span>
                        </>
                      )}
                    </div>
                  }
                />

                <MobileListItemTrailing>
                  <StudentStatusBadge isActive={student.isActive} />
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <PermissionGuard
                permission={PERMISSIONS.VIEW_STUDENTS}
                mode="hide"
              >
                <ContextMenuItem onSelect={() => onViewProfile(student)}>
                  <Eye className="me-2 size-4 text-muted-foreground" />
                  {t("actions.viewProfile")}
                </ContextMenuItem>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_STUDENTS}
                mode="hide"
              >
                <ContextMenuItem onSelect={() => onEdit(student)}>
                  <Edit className="me-2 size-4 text-muted-foreground" />
                  {t("actions.edit")}
                </ContextMenuItem>

                <ContextMenuItem onSelect={() => onResetPassword(student)}>
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
