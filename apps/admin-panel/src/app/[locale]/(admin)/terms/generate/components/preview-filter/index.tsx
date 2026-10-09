"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { SlidersHorizontal, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { AdminFilterBar } from "@/components/admin-filter-bar"

export interface PreviewFilterProps {
  onEditConfig: () => void
  onSubmit: () => void
  isSubmitDisabled?: boolean
  isSubmitLoading?: boolean
}

export function PreviewFilter({
  onEditConfig,
  onSubmit,
  isSubmitDisabled = false,
  isSubmitLoading = false,
}: PreviewFilterProps) {
  const t = useTranslations("terms")

  return (
    <AdminFilterBar
      autoHideOnMobile={false}
      search={
        <div className="flex min-h-14 w-full min-w-0 flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2 sm:h-14 sm:py-0">
          <p className="min-w-0 text-xs text-muted-foreground sm:text-sm">
            {t("batchModal.dateShiftHint")}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditConfig}
            className="h-9 shrink-0 gap-2 rounded-xl border-border px-3 text-xs font-semibold text-foreground sm:h-10 sm:px-4 sm:text-sm"
          >
            <SlidersHorizontal className="size-4" />
            <span>{t("batchModal.editConfig")}</span>
          </Button>
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
