"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { BookOpen, Edit2, Plus, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
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
  EmptyContent,
} from "@workspace/ui/components/empty"
import { PERMISSIONS, type CourseDto } from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { CoursePrerequisiteBadge } from "../course-prerequisite-badge"

export interface CoursesListProps {
  courses: CourseDto[] | undefined
  isLoading: boolean
  onEdit: (course: CourseDto) => void
  onAdd?: () => void
  onBatch?: () => void
}

export function CoursesList({
  courses,
  isLoading,
  onEdit,
  onAdd,
  onBatch,
}: CoursesListProps) {
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
        {(onBatch || onAdd) && (
          <EmptyContent>
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_COURSES}
              mode="hide"
            >
              <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                {onBatch && (
                  <Button
                    type="button"
                    onClick={onBatch}
                    className="cursor-pointer gap-2"
                  >
                    <Sparkles className="size-5" />
                    <span>{t("createGroupCourses")}</span>
                  </Button>
                )}
                {onAdd && (
                  <Button
                    type="button"
                    variant={onBatch ? "outline" : "default"}
                    onClick={onAdd}
                    className={`cursor-pointer gap-2 ${
                      onBatch ? "size-14 shrink-0 p-0 sm:w-auto sm:px-6" : ""
                    }`}
                    aria-label={t("addSingleCourse")}
                    title={t("addSingleCourse")}
                  >
                    <Plus className="size-5" />
                    <span className={onBatch ? "hidden sm:inline" : ""}>
                      {t("addSingleCourse")}
                    </span>
                  </Button>
                )}
              </div>
            </PermissionGuard>
          </EmptyContent>
        )}
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
              <ContextMenuItem onClick={() => onEdit(course)}>
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
