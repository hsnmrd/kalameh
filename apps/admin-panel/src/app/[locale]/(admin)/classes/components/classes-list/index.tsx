"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Layers, Edit2, GraduationCap } from "lucide-react"
import { Link } from "@/i18n/routing"
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
import { formatNumber } from "@workspace/ui/lib/utils"
import { PERMISSIONS, type ClassDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface ClassesListProps {
  classes: ClassDto[] | undefined
  isLoading: boolean
  onEdit: (cls: ClassDto) => void
}

export function ClassesList({ classes, isLoading, onEdit }: ClassesListProps) {
  const t = useTranslations("classes")
  const locale = useLocale()

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!classes || classes.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Layers className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {classes.map((cls, index) => {
        const enrolled = cls.enrolledCount ?? 0
        const cap = cls.capacity
        const isFull = enrolled >= cap

        return (
          <ContextMenu key={cls.id}>
            <ContextMenuTrigger>
              <MobileListItem
                onClick={() => onEdit(cls)}
                isLast={index === classes.length - 1}
              >
                <MobileListItemIcon>
                  <Layers className="size-5" />
                </MobileListItemIcon>

                <MobileListItemContent
                  primary={cls.title}
                  secondary={
                    <div className="flex flex-col gap-0.5">
                      <span>{cls.course?.title || cls.term?.title || "-"}</span>
                      {cls.branch?.name && (
                        <span className="text-[11px] text-muted-foreground/80">
                          {cls.branch.name}
                        </span>
                      )}
                    </div>
                  }
                />

                <MobileListItemTrailing>
                  <Badge
                    variant="outline"
                    className={
                      isFull
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
                        : "border-border bg-muted text-muted-foreground"
                    }
                  >
                    <span className="font-sans text-xs">
                      {formatNumber(enrolled, locale)} /{" "}
                      {formatNumber(cap, locale)}
                    </span>
                  </Badge>
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <PermissionGuard
                permission={[
                  PERMISSIONS.VIEW_GRADES,
                  PERMISSIONS.MANAGE_GRADES,
                ]}
                mode="hide"
              >
                <Link href={`/classes/${cls.id}/grades`}>
                  <ContextMenuItem>
                    <GraduationCap className="me-2 size-4 text-primary" />
                    {t("grades")}
                  </ContextMenuItem>
                </Link>
              </PermissionGuard>

              <PermissionGuard
                permission={PERMISSIONS.MANAGE_CLASSES}
                mode="hide"
              >
                <ContextMenuItem onSelect={() => onEdit(cls)}>
                  <Edit2 className="me-2 size-4 text-muted-foreground" />
                  {t("table.actions")}
                </ContextMenuItem>
              </PermissionGuard>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </MobileList>
  )
}
