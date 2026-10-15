import * as React from "react"
import { CalendarContent } from "./components/calendar-content"
import { TableSkeleton } from "@/components/table-skeleton"

export default function CalendarPage() {
  return (
    <React.Suspense fallback={<TableSkeleton rows={6} />}>
      <CalendarContent />
    </React.Suspense>
  )
}
