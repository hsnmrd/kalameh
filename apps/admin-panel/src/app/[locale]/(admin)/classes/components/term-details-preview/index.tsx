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
        "flex animate-in flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground transition-all fade-in-50",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1 font-medium text-foreground">
          <Calendar className="size-3.5 text-foreground" />
          <span>{t("termDatesLabel")}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium text-foreground">
            {formatDate(term.startDate, locale)}
          </span>
          <span className="text-muted-foreground/70">
            {t("toDateSeparator")}
          </span>
          <span className="font-medium text-foreground">
            {formatDate(term.endDate, locale)}
          </span>
        </div>
      </div>

      {term.isActive && (
        <Badge
          variant="secondary"
          className="h-5 px-1.5 text-[10px] font-normal"
        >
          {t("activeTermBadge")}
        </Badge>
      )}
    </div>
  )
}
