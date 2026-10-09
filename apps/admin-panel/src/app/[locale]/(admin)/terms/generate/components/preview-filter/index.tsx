"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, Info } from "lucide-react"
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
      onFilterClick={onEditConfig}
      filterButtonLabel={t("batchModal.editConfig")}
      filterButtonAriaLabel={t("batchModal.editConfig")}
      search={
        <div
          title={t("batchModal.dateShiftHint")}
          className="flex h-14 w-full min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-card px-4 text-xs text-muted-foreground sm:text-sm"
        >
          <Info className="size-5 shrink-0 text-muted-foreground" />
          <p className="min-w-0 truncate">{t("batchModal.dateShiftHint")}</p>
        </div>
      }
      actions={
        <Button
          type="button"
          disabled={isSubmitDisabled}
          onClick={onSubmit}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
        >
          {isSubmitLoading ? (
            <Spinner className="size-5 text-primary-foreground" />
          ) : (
            <Check className="size-5 text-primary-foreground" />
          )}
          <span>{t("batchModal.submit")}</span>
        </Button>
      }
    />
  )
}
