"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { UserCheck, Eye, Edit, KeyRound, Trash2, Clock } from "lucide-react"
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
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type TeacherDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface TeachersListProps {
  teachers: TeacherDto[] | undefined
  isLoading: boolean
  onViewProfile: (teacher: TeacherDto) => void
  onEdit: (teacher: TeacherDto) => void
  onManageAvailability: (teacher: TeacherDto) => void
  onResetPassword: (teacher: TeacherDto) => void
  onDelete: (teacher: TeacherDto) => void
}

export function TeachersList({
  teachers,
  isLoading,
  onViewProfile,
  onEdit,
  onManageAvailability,
  onResetPassword,
  onDelete,
}: TeachersListProps) {
  const t = useTranslations("teachers")

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!teachers || teachers.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <UserCheck className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {teachers.map((teacher, index) => {
        const fullName = `${teacher.firstName} ${teacher.lastName}`
        const initials = `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`
        const availCount = teacher.teacherProfile?.availabilities?.length || 0

        return (
          <ContextMenu key={teacher.id}>
            <ContextMenuTrigger>
              <MobileListItem
                onClick={() => onViewProfile(teacher)}
                isLast={index === teachers.length - 1}
              >
                <MobileListItemIcon>
                  {teacher.avatarUrl ? (
                    <Image
                      src={getAssetUrl(teacher.avatarUrl)}
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
                      <span>{teacher.phone}</span>
                      {teacher.teacherProfile?.degree && (
                        <>
                          <span>•</span>
                          <span className="font-sans text-muted-foreground">
                            {teacher.teacherProfile.degree}
                          </span>
                        </>
                      )}
                    </div>
                  }
                />

                <MobileListItemTrailing>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={teacher.isActive ? "outline" : "secondary"}
                      className={
                        teacher.isActive
                          ? "border-success/30 bg-success/10 text-[10px] text-success"
                          : "text-[10px] text-muted-foreground"
                      }
                    >
                      {teacher.isActive
                        ? t("status.active")
                        : t("status.inactive")}
                    </Badge>
                    {availCount > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {t("availabilities.slotsCount", { count: availCount })}
                      </span>
                    )}
                  </div>
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-48">
              <ContextMenuItem
                onClick={() => onViewProfile(teacher)}
                className="gap-2"
              >
                <Eye className="size-4 text-muted-foreground" />
                <span>{t("actions.viewProfile")}</span>
              </ContextMenuItem>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_TEACHERS}
                mode="hide"
              >
                <ContextMenuItem
                  onClick={() => onManageAvailability(teacher)}
                  className="gap-2"
                >
                  <Clock className="size-4 text-muted-foreground" />
                  <span>{t("actions.manageAvailability")}</span>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => onEdit(teacher)}
                  className="gap-2"
                >
                  <Edit className="size-4 text-muted-foreground" />
                  <span>{t("actions.edit")}</span>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => onResetPassword(teacher)}
                  className="gap-2"
                >
                  <KeyRound className="size-4 text-muted-foreground" />
                  <span>{t("actions.resetPassword")}</span>
                </ContextMenuItem>

                <ContextMenuItem
                  onClick={() => onDelete(teacher)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 text-destructive" />
                  <span>{t("actions.delete")}</span>
                </ContextMenuItem>
              </PermissionGuard>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </MobileList>
  )
}
