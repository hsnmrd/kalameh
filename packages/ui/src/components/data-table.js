"use client"
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
export function DataTable({
  columns,
  data,
  emptyMessage = "موردی برای نمایش یافت نشد",
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
  return _jsx("div", {
    className:
      "overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xs",
    children: _jsxs(Table, {
      children: [
        _jsx(TableHeader, {
          children: table.getHeaderGroups().map((headerGroup) =>
            _jsx(
              TableRow,
              {
                children: headerGroup.headers.map((header) => {
                  return _jsx(
                    TableHead,
                    {
                      children: header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          ),
                    },
                    header.id
                  )
                }),
              },
              headerGroup.id
            )
          ),
        }),
        _jsx(TableBody, {
          children: table.getRowModel().rows?.length
            ? table
                .getRowModel()
                .rows.map((row) =>
                  _jsx(
                    TableRow,
                    {
                      "data-state": row.getIsSelected() && "selected",
                      children: row
                        .getVisibleCells()
                        .map((cell) =>
                          _jsx(
                            TableCell,
                            {
                              children: flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              ),
                            },
                            cell.id
                          )
                        ),
                    },
                    row.id
                  )
                )
            : _jsx(TableRow, {
                children: _jsx(TableCell, {
                  colSpan: columns.length,
                  className: "h-24 text-center text-muted-foreground",
                  children: emptyMessage,
                }),
              }),
        }),
      ],
    }),
  })
}
