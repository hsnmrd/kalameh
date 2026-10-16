"use client"

/* eslint-disable react-hooks/incompatible-library */
import * as React from "react"
import {
  type ColumnDef,
  type Row,
  type TableMeta,
  type PaginationState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { cn } from "@workspace/ui/lib/utils"
import {
  Empty,
  EmptyHeader,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  DataPagination,
  type DataPaginationLabels,
} from "@workspace/ui/components/pagination"

export interface DataTablePaginationConfig {
  pageSize?: number
  pageSizeOptions?: number[]
  showPageSize?: boolean
  showTotal?: boolean
  showFirstLast?: boolean
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  emptyMessage?: React.ReactNode
  getRowClassName?: (row: Row<TData>) => string | undefined
  className?: string
  containerClassName?: string
  tableClassName?: string
  meta?: TableMeta<TData>
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string
  pagination?: boolean | DataTablePaginationConfig
  pageIndex?: number
  onPageIndexChange?: (pageIndex: number) => void
  pageSize?: number
  onPageSizeChange?: (pageSize: number) => void
  paginationLabels?: DataPaginationLabels
  locale?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "موردی برای نمایش یافت نشد",
  getRowClassName,
  className,
  containerClassName,
  tableClassName,
  meta,
  getRowId,
  pagination = false,
  pageIndex: pageIndexProp,
  onPageIndexChange,
  pageSize: pageSizeProp,
  onPageSizeChange,
  paginationLabels,
  locale,
}: DataTableProps<TData, TValue>) {
  const isPaginationEnabled = Boolean(pagination)
  const paginationConfig: DataTablePaginationConfig =
    typeof pagination === "object" ? pagination : {}

  const defaultPageSize = paginationConfig.pageSize ?? 10
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: defaultPageSize,
    })

  const isControlled = pageIndexProp !== undefined
  const paginationState: PaginationState = React.useMemo(
    () => ({
      pageIndex: isControlled ? pageIndexProp : internalPagination.pageIndex,
      pageSize:
        pageSizeProp !== undefined
          ? pageSizeProp
          : (paginationConfig.pageSize ?? internalPagination.pageSize),
    }),
    [
      isControlled,
      pageIndexProp,
      pageSizeProp,
      paginationConfig.pageSize,
      internalPagination,
    ]
  )

  const handlePaginationChange = React.useCallback(
    (updaterOrValue: any) => {
      const nextState =
        typeof updaterOrValue === "function"
          ? updaterOrValue(paginationState)
          : updaterOrValue

      if (!isControlled) {
        setInternalPagination(nextState)
      }
      onPageIndexChange?.(nextState.pageIndex)
      if (nextState.pageSize !== paginationState.pageSize) {
        onPageSizeChange?.(nextState.pageSize)
      }
    },
    [paginationState, isControlled, onPageIndexChange, onPageSizeChange]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(isPaginationEnabled
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          onPaginationChange: handlePaginationChange,
          state: {
            pagination: paginationState,
          },
        }
      : {}),
    meta,
    getRowId,
  })

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xs",
        className
      )}
    >
      <Table className={tableClassName} containerClassName={containerClassName}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={getRowClassName?.(row)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                {typeof emptyMessage === "string" ? (
                  <Empty variant="ghost" className="min-h-[140px] p-2">
                    <EmptyHeader>
                      <EmptyDescription className="text-xs text-muted-foreground">
                        {emptyMessage}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  emptyMessage
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {isPaginationEnabled && data.length > 0 && (
        <DataPagination
          pageIndex={table.getState().pagination.pageIndex}
          pageSize={table.getState().pagination.pageSize}
          totalItems={data.length}
          onPageChange={(newPageIndex) => table.setPageIndex(newPageIndex)}
          onPageSizeChange={(newPageSize) => table.setPageSize(newPageSize)}
          pageSizeOptions={
            paginationConfig.pageSizeOptions ?? [10, 20, 50, 100]
          }
          showPageSize={paginationConfig.showPageSize ?? true}
          showTotal={paginationConfig.showTotal ?? true}
          showFirstLast={paginationConfig.showFirstLast ?? true}
          labels={paginationLabels}
          locale={locale}
          className="border-t border-border px-4 py-3"
        />
      )}
    </div>
  )
}
