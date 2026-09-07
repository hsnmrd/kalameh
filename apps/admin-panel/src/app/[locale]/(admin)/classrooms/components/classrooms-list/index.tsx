"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Building2, DoorOpen, Edit2, Trash2, Users } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@workspace/ui/components/context-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  MobileList,
  MobileListItem,
  MobileListItemContent,
  MobileListItemIcon,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type ClassroomDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { ClassroomStatusBadge } from "../classroom-status-badge"

export interface ClassroomsListProps {
  classrooms: ClassroomDto[] | undefined
  isLoading: boolean
  onEdit: (classroom: ClassroomDto) => void
  onDelete: (classroom: ClassroomDto) => void
}

export function ClassroomsList({
  classrooms,
  isLoading,
  onEdit,
  onDelete,
}: ClassroomsListProps) {
  const t = useTranslations("classrooms")
  const locale = useLocale()

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!classrooms || classrooms.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <DoorOpen className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {classrooms.map((classroom, index) => (
        <ContextMenu key={classroom.id}>
          <ContextMenuTrigger>
            <MobileListItem
              onClick={() => onEdit(classroom)}
              isLast={index === classrooms.length - 1}
            >
              <MobileListItemIcon>
                <DoorOpen className="size-5" />
              </MobileListItemIcon>

              <MobileListItemContent
                primary={classroom.name}
                secondary={
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex min-w-0 items-center gap-1">
                      <Building2 className="size-3 shrink-0" />
                      <span className="truncate">
                        {classroom.branch?.name || t("createModal.noBranch")}
                      </span>
                    </span>
                    <span aria-hidden>•</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <Users className="size-3" />
                      <span>
                        {formatNumber(classroom.capacity, locale)} {t("person")}
                      </span>
                    </span>
                  </div>
                }
              />

              <MobileListItemTrailing>
                <ClassroomStatusBadge isActive={classroom.isActive} />
              </MobileListItemTrailing>
            </MobileListItem>
          </ContextMenuTrigger>

          <ContextMenuContent drawerTitle={t("table.actions")}>
            <ContextMenuGroup>
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_CLASSROOMS}
                mode="hide"
              >
                <ContextMenuItem onClick={() => onEdit(classroom)}>
                  <Edit2 />
                  {t("editModal.title")}
                </ContextMenuItem>
                <ContextMenuItem
                  variant="destructive"
                  onClick={() => onDelete(classroom)}
                >
                  <Trash2 />
                  {t("deleteModal.title")}
                </ContextMenuItem>
              </PermissionGuard>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </MobileList>
  )
}
