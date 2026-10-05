"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  Check,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminFilterBar } from "@/components/admin-filter-bar"

export interface PreviewFilterProps {
  viewMode: "calendar" | "table"
  onViewModeChange: (mode: "calendar" | "table") => void
  onSubmit: () => void
  isSubmitDisabled?: boolean
  isSubmitLoading?: boolean
}

export function PreviewFilter({
  viewMode,
  onViewModeChange,
  onSubmit,
  isSubmitDisabled = false,
  isSubmitLoading = false,
}: PreviewFilterProps) {
  const t = useTranslations("terms")

  return (
    <AdminFilterBar
      autoHideOnMobile={false}
      search={
        <div className="flex min-h-14 w-full min-w-0 flex-col justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 sm:h-14 sm:flex-row sm:items-center sm:py-0">
          <p className="min-w-0 text-xs text-muted-foreground sm:text-sm">
            {t("batchModal.dateShiftHint")}
          </p>

          {/* View Mode Toggle Tabs */}
          <div className="flex shrink-0 items-center rounded-xl border border-border bg-muted/40 p-1">
            <Button
              type="button"
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("calendar")}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold"
            >
              <CalendarIcon className="size-3.5" />
              <span>{t("batchModal.calendarView")}</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("table")}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold"
            >
              <TableIcon className="size-3.5" />
              <span>{t("batchModal.tableView")}</span>
            </Button>
          </div>
        </div>
      }
      actions={
        <Button
          type="button"
          disabled={isSubmitDisabled}
          onClick={onSubmit}
          className="cursor-pointer"
        >
          {isSubmitLoading ? <Spinner /> : <Check />}
          <span>{t("batchModal.submit")}</span>
        </Button>
      }
    />
  )
}
