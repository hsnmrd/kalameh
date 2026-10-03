"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Calendar } from "lucide-react"
import { cn, formatDate } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import type { TermDto } from "@workspace/types"

export interface TermDetailsPreviewProps {
  term?: TermDto | null
  className?: string
}

export function TermDetailsPreview({
  term,
  className,
}: TermDetailsPreviewProps) {
  const t = useTranslations("classes.createModal")
  const locale = useLocale()

  if (!term) {
    return null
  }

  return (
    <div
      className={cn(
        "flex animate-in flex-wrap items-center justify-between gap-2 rounded-xl border border-success/25 bg-success/10 px-3.5 py-2.5 text-xs text-success transition-all fade-in-50",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-success">
          <Calendar className="size-4 shrink-0 text-success" />
          <span>{t("termDatesLabel")}</span>
        </div>
        <div className="flex items-center gap-1 font-medium text-foreground">
          <span>{formatDate(term.startDate, locale)}</span>
          <span className="text-muted-foreground">{t("toDateSeparator")}</span>
          <span>{formatDate(term.endDate, locale)}</span>
        </div>
      </div>

      {term.isActive && (
        <Badge
          variant="outline"
          className="h-5 border-success/30 bg-success/15 px-2 text-[10px] font-medium text-success"
        >
          {t("activeTermBadge")}
        </Badge>
      )}
    </div>
  )
}
