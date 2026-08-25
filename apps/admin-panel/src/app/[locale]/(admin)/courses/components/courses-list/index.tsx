"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { BookOpen, Edit2 } from "lucide-react"
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
import { Price } from "@workspace/ui/components/price"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import { PERMISSIONS, type CourseDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { CoursePrerequisiteBadge } from "../course-prerequisite-badge"

export interface CoursesListProps {
  courses: CourseDto[] | undefined
  isLoading: boolean
  onEdit: (course: CourseDto) => void
}

export function CoursesList({ courses, isLoading, onEdit }: CoursesListProps) {
  const t = useTranslations("courses")
  const locale = useLocale()

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!courses || courses.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <BookOpen className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <MobileList>
      {courses.map((course, index) => (
        <ContextMenu key={course.id}>
          <ContextMenuTrigger>
            <MobileListItem
              onClick={() => onEdit(course)}
              isLast={index === courses.length - 1}
            >
              <MobileListItemIcon>
                <BookOpen className="size-5" />
              </MobileListItemIcon>

              <MobileListItemContent
                primary={course.title}
                secondary={
                  <div className="flex items-center gap-2">
                    <Price
                      amount={course.baseFee}
                      locale={locale}
                      className="text-xs text-muted-foreground"
                    />
                    {course.prerequisite ? (
                      <span className="text-xs text-muted-foreground">
                        • {course.prerequisite.title}
                      </span>
                    ) : null}
                  </div>
                }
              />

              <MobileListItemTrailing>
                <CoursePrerequisiteBadge prerequisite={course.prerequisite} />
              </MobileListItemTrailing>
            </MobileListItem>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_COURSES}
              mode="hide"
            >
              <ContextMenuItem onSelect={() => onEdit(course)}>
                <Edit2 className="me-2 size-4 text-muted-foreground" />
                {t("table.actions")}
              </ContextMenuItem>
            </PermissionGuard>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </MobileList>
  )
}
