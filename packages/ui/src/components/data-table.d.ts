import * as React from "react"
import { type ColumnDef } from "@tanstack/react-table"
export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  emptyMessage?: React.ReactNode
}
export declare function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage,
}: DataTableProps<TData, TValue>): React.JSX.Element
//# sourceMappingURL=data-table.d.ts.map
