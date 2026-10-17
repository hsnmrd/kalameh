"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { BookDto } from "@workspace/types"
import { PERMISSIONS, APP_MODULES, ROLES } from "@workspace/types"
import { FABSingle } from "@workspace/ui/components/fab"
import { booksResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { usePermissions, useModal, useUrlFilters } from "@/lib/hooks"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ModalGateway } from "@/components/modal-gateway"
import { modalRegistry } from "./modal"
import { BooksFilter } from "./components/books-filter"
import { BooksTable } from "./components/books-table"
import { BooksList } from "./components/books-list"
import { TableSkeleton } from "@/components/table-skeleton"
import { ListSkeleton } from "@/components/list-skeleton"

export default function BooksPage() {
  const t = useTranslations("books")
  const { openModal } = useModal()

  const { filters, setFilter, pageIndex, pageSize, setPageIndex, setPageSize } =
    useUrlFilters({
      defaultValues: {
        search: "",
        page: 1,
        pageSize: 10,
      },
      debounceKeys: ["search"],
    })

  const { activeInstitute, activeInstituteId } = useActiveInstitute()
  const { user } = usePermissions()

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const hasModule =
    isSuperAdmin ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.CLASSES_COURSES) ||
    activeInstitute?.enabledModules?.includes(APP_MODULES.BOOKS)

  const { data: books = [], isLoading } = useQuery({
    ...booksResource.list.toQuery({
      instituteId: activeInstituteId,
      search: filters.search.trim() || undefined,
    }),
    enabled: Boolean(activeInstituteId && hasModule),
  })

  const isListEmpty = !isLoading && books.length === 0

  const handleCreate = () => openModal("createBook")
  const handleEdit = (book: BookDto) => openModal("editBook", { book })
  const handleDelete = (book: BookDto) => openModal("deleteBook", { book })
  const handleGenerateCourses = (book: BookDto) =>
    openModal("generateCourses", { book })

  return (
    <ModuleGuard module={APP_MODULES.CLASSES_COURSES}>
      <PermissionGuard permission={PERMISSIONS.VIEW_BOOKS} mode="forbidden">
        <AdminPageShell
          isEmpty={isListEmpty}
          filters={
            <BooksFilter
              isEmpty={isListEmpty}
              search={filters.search}
              onSearchChange={(search) => setFilter("search", search)}
              onAddClick={isListEmpty ? undefined : handleCreate}
            />
          }
          modals={
            <ModalGateway
              registry={modalRegistry}
              extraProps={{ instituteId: activeInstituteId }}
            />
          }
          fab={
            isListEmpty ? null : (
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_BOOKS}
                mode="hide"
              >
                <FABSingle onClick={handleCreate} aria-label={t("addBook")} />
              </PermissionGuard>
            )
          }
        >
          {/* Desktop view */}
          <div className="hidden lg:block">
            <React.Suspense fallback={<TableSkeleton rows={pageSize} />}>
              <BooksTable
                books={books}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onGenerateCourses={handleGenerateCourses}
                onAdd={handleCreate}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={setPageSize}
              />
            </React.Suspense>
          </div>

          {/* Mobile view */}
          <div className="flex flex-1 flex-col lg:hidden">
            <React.Suspense
              fallback={<ListSkeleton rows={pageSize} showSpinner />}
            >
              <BooksList
                books={books}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onGenerateCourses={handleGenerateCourses}
                onAdd={handleCreate}
                pageIndex={pageIndex}
                pageSize={pageSize}
                onPageChange={setPageIndex}
              />
            </React.Suspense>
          </div>
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
