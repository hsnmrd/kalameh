"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Book, Layers, Pencil, Plus, Trash2 } from "lucide-react"
import type { BookDto } from "@workspace/types"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  MobileList,
  MobileListItem,
  MobileListItemIcon,
  MobileListItemContent,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import { DataPagination } from "@workspace/ui/components/pagination"
import { useClientPagination } from "@/lib/hooks"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@workspace/ui/components/context-menu"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@workspace/ui/components/empty"
import { PermissionGuard } from "@/components/permission-guard"

export interface BooksListProps {
  books: BookDto[]
  isLoading: boolean
  onEdit: (book: BookDto) => void
  onDelete: (book: BookDto) => void
  onGenerateCourses: (book: BookDto) => void
  onAdd: () => void
  pageIndex?: number
  pageSize?: number
  onPageChange?: (pageIndex: number) => void
}

export function BooksList({
  books,
  isLoading,
  onEdit,
  onDelete,
  onGenerateCourses,
  onAdd,
  pageIndex: controlledPageIndex,
  pageSize = 10,
  onPageChange: controlledOnPageChange,
}: BooksListProps) {
  const t = useTranslations("books")
  const locale = useLocale()

  const { pageIndex, setPageIndex, paginatedData } = useClientPagination({
    data: books,
    pageSize,
    pageIndex: controlledPageIndex,
    onPageChange: controlledOnPageChange,
  })

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
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
    <>
      <MobileList>
        {paginatedData.map((book, index) => (
          <ContextMenu key={book.id}>
            <ContextMenuTrigger>
              <MobileListItem
                onClick={() =>
                  book.isGlobal || !book.instituteId
                    ? onGenerateCourses(book)
                    : onEdit(book)
                }
                isLast={index === paginatedData.length - 1}
              >
                <MobileListItemIcon>
                  <Book className="size-5 text-muted-foreground" />
                </MobileListItemIcon>

                <MobileListItemContent
                  primary={
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {book.title}
                      </span>
                      {book.isGlobal || !book.instituteId ? (
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 text-[10px] font-normal"
                        >
                          {t("globalBookBadge")}
                        </Badge>
                      ) : null}
                    </div>
                  }
                  secondary={
                    book.publisher ? <span>{book.publisher}</span> : undefined
                  }
                />

                <MobileListItemTrailing>
                  {(book.coursesCount ?? 0) > 0 ? (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {book.coursesCount}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("actions.noCourses")}
                    </span>
                  )}
                </MobileListItemTrailing>
              </MobileListItem>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_COURSES}
                mode="hide"
              >
                <ContextMenuItem onClick={() => onGenerateCourses(book)}>
                  <Layers className="me-2 size-4 text-muted-foreground" />
                  <span>{t("actions.generateCourses")}</span>
                </ContextMenuItem>
              </PermissionGuard>

              {!book.isGlobal && Boolean(book.instituteId) && (
                <PermissionGuard
                  permission={PERMISSIONS.MANAGE_BOOKS}
                  mode="hide"
                >
                  <ContextMenuItem onClick={() => onEdit(book)}>
                    <Pencil className="me-2 size-4 text-muted-foreground" />
                    <span>{t("actions.edit")}</span>
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => onDelete(book)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="me-2 size-4 text-destructive" />
                    <span>{t("actions.delete")}</span>
                  </ContextMenuItem>
                </PermissionGuard>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </MobileList>

      {books.length > pageSize && (
        <div className="pt-4 pb-2">
          <DataPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalItems={books.length}
            onPageChange={setPageIndex}
            compact
            locale={locale}
          />
        </div>
      )}
    </>
  )
}
