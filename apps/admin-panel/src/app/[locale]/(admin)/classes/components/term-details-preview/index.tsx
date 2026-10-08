"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Calendar, AlertCircle } from "lucide-react"
import { cn, formatDate } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import {
  isTermInActivationWindow,
  isTermEligibleForClassCreation,
  getTermActivationDate,
  type TermDto,
} from "@workspace/types"

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

  const inActivationWindow = isTermInActivationWindow(term.startDate)
  const isEligible = isTermEligibleForClassCreation({
    startDate: term.startDate,
    endDate: term.endDate,
    classesCount: term.classesCount,
  })
  const isBeforeActivation =
    new Date().getTime() < getTermActivationDate(term.startDate).getTime()
  const isAfterEnd =
    new Date().getTime() > new Date(term.endDate).setHours(23, 59, 59, 999)

  if (!isEligible) {
    return (
      <div
        className={cn(
          "flex animate-in flex-col gap-1.5 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive transition-all fade-in-50",
          className
        )}
      >
        <div className="flex items-center gap-1.5 font-semibold text-destructive">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <span>
            {t(
              isBeforeActivation
                ? "termNotActivated"
                : isAfterEnd
                  ? "termEnded"
                  : "termActivationPassed"
            )}
          </span>
        </div>
        <p className="text-[11px] text-destructive/90">
          {t("activationWindowWarning")}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-foreground">
          <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">{t("termDatesLabel")}</span>
          <span>{formatDate(term.startDate, locale)}</span>
          <span className="text-muted-foreground">{t("toDateSeparator")}</span>
          <span>{formatDate(term.endDate, locale)}</span>
        </div>
      </div>
    )
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

      <div className="flex items-center gap-1.5">
        <Badge
          variant="outline"
          className="h-5 border-success/30 bg-success/15 px-2 text-[10px] font-medium text-success"
        >
          {inActivationWindow
            ? t("inActivationWindow")
            : t("initialClassCreationWindow")}
        </Badge>
        {term.isActive && (
          <Badge
            variant="outline"
            className="h-5 border-success/30 bg-success/15 px-2 text-[10px] font-medium text-success"
          >
            {t("activeTermBadge")}
          </Badge>
        )}
      </div>
    </div>
  )
}
