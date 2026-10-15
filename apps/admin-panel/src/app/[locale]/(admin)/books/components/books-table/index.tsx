"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import type { ColumnDef } from "@tanstack/react-table"
import { Book, Layers, Pencil, Plus, Trash2 } from "lucide-react"
import type { BookDto } from "@workspace/types"
import { PERMISSIONS } from "@workspace/types"
import { DataTable } from "@workspace/ui/components/data-table"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { PermissionGuard } from "@/components/permission-guard"

export interface BooksTableProps {
  books: BookDto[]
  isLoading: boolean
  onEdit: (book: BookDto) => void
  onDelete: (book: BookDto) => void
  onGenerateCourses: (book: BookDto) => void
  onAdd: () => void
  pageIndex?: number
  pageSize?: number
  onPageIndexChange?: (pageIndex: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function BooksTable({
  books,
  isLoading,
  onEdit,
  onDelete,
  onGenerateCourses,
  onAdd,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
}: BooksTableProps) {
  const t = useTranslations("books")
  const locale = useLocale()

  const columns = React.useMemo<ColumnDef<BookDto>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("columns.title"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Book className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {row.original.title}
                </span>
                {row.original.isGlobal || !row.original.instituteId ? (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    {t("globalBookBadge")}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    {t("catalogCustom")}
                  </Badge>
                )}
              </div>
              {row.original.description && (
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {row.original.description}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        id: "authorPublisher",
        accessorFn: (row) =>
          [row.author, row.publisher].filter(Boolean).join(" "),
        header: t("columns.authorPublisher"),
        cell: ({ row }) => {
          const author = row.original.author?.trim()
          const publisher = row.original.publisher?.trim()

          if (!author && !publisher) {
            return <span className="text-sm text-muted-foreground">—</span>
          }

          return (
            <div className="flex flex-col gap-0.5">
              {author && (
                <span className="text-sm font-medium text-foreground">
                  {author}
                </span>
              )}
              {publisher && (
                <span className="text-xs text-muted-foreground">
                  {publisher}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "coursesCount",
        header: t("columns.coursesCount"),
        cell: ({ row }) => {
          const count = row.original.coursesCount ?? 0
          return count > 0 ? (
            <Badge
              variant="secondary"
              className="font-mono text-xs font-medium"
            >
              {count}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("actions.noCourses")}
            </span>
          )
        },
      },
      {
        accessorKey: "isActive",
        header: t("columns.status"),
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? "default" : "outline"}
            className="text-xs"
          >
            {row.original.isActive ? t("statusActive") : t("statusInactive")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: t("columns.actions"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_COURSES}
              mode="hide"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateCourses(row.original)}
                className="h-8 cursor-pointer gap-1.5 rounded-lg px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                title={t("actions.generateCourses")}
              >
                <Layers className="size-3.5 text-muted-foreground" />
                <span className="hidden xl:inline">
                  {t("actions.generateCourses")}
                </span>
              </Button>
            </PermissionGuard>

            {!row.original.isGlobal && Boolean(row.original.instituteId) && (
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_BOOKS}
                mode="hide"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(row.original)}
                  className="size-8 cursor-pointer rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t("actions.edit")}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(row.original)}
                  className="size-8 cursor-pointer rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t("actions.delete")}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </PermissionGuard>
            )}
          </div>
        ),
      },
    ],
    [t, onEdit, onDelete, onGenerateCourses]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Book className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <PermissionGuard permission={PERMISSIONS.MANAGE_BOOKS} mode="hide">
            <Button onClick={onAdd} className="cursor-pointer gap-2">
              <Plus className="size-4" />
              <span>{t("addBook")}</span>
            </Button>
          </PermissionGuard>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={books}
      pagination={{ pageSize: pageSize ?? 10 }}
      pageIndex={pageIndex}
      onPageIndexChange={onPageIndexChange}
      pageSize={pageSize}
      onPageSizeChange={onPageSizeChange}
      locale={locale}
    />
  )
}
