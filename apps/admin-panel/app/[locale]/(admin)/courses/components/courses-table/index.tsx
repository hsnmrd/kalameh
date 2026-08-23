"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { BookOpen, Edit2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import { Price } from "@workspace/ui/components/price"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { CourseDto } from "@workspace/types"
import { CoursePrerequisiteBadge } from "../course-prerequisite-badge"

export interface CoursesTableProps {
  courses: CourseDto[] | undefined
  isLoading: boolean
  onEdit: (course: CourseDto) => void
}

export function CoursesTable({
  courses,
  isLoading,
  onEdit,
}: CoursesTableProps) {
  const t = useTranslations("courses")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<CourseDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("table.title"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <BookOpen className="size-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              {row.original.title}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "baseFee",
        header: t("table.baseFee"),
        cell: ({ row }) => (
          <Price
            amount={row.original.baseFee}
            locale={locale}
            className="text-sm text-foreground"
          />
        ),
      },
      {
        accessorKey: "prerequisite",
        header: t("table.prerequisite"),
        cell: ({ row }) => (
          <CoursePrerequisiteBadge prerequisite={row.original.prerequisite} />
        ),
      },
      {
        accessorKey: "classesCount",
        header: t("table.classesCount"),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
            {formatNumber(row.original.classesCount ?? 0, locale)}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label={t("table.actions")}
            >
              <Edit2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, locale, onEdit]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BookOpen className="size-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {t("table.empty")}
        </p>
      </div>
    )
  }

  return <DataTable columns={columns} data={courses} />
}
