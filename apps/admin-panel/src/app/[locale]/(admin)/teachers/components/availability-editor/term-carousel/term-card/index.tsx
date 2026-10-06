"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarCheck, CalendarX, Clock } from "lucide-react"
import type { TermDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface TermCardProps {
  term: TermDto
  isSelected: boolean
  availableClassesCount: number
  onSelect: (termId: string) => void
  disabled?: boolean
}

export function TermCard({
  term,
  isSelected,
  availableClassesCount,
  onSelect,
  disabled = false,
}: TermCardProps) {
  const t = useTranslations("teachers.availabilities")
  const phase = term.operatingPhase

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={() => onSelect(term.id)}
      className={cn(
        "group/card flex h-auto w-full cursor-pointer flex-col items-stretch justify-between gap-2.5 rounded-2xl border p-3.5 text-start transition-all",
        isSelected
          ? "border-primary bg-primary/10 text-foreground shadow-2xs ring-1 ring-primary/30"
          : "border-border bg-card text-foreground hover:border-border/80 hover:bg-muted/40"
      )}
      aria-pressed={isSelected}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-foreground">
          {term.title}
        </span>
        {term.isActive && (
          <Badge
            variant="secondary"
            className="shrink-0 px-1.5 py-0 text-[10px] font-normal"
          >
            {t("activeTermBadge")}
          </Badge>
        )}
      </div>

      {phase ? (
        <div
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          dir="ltr"
        >
          <Clock className="size-3 shrink-0 text-muted-foreground" />
          <span className="font-medium">
            {phase.startTime} - {phase.endTime}
          </span>
        </div>
      ) : null}

      {availableClassesCount > 0 ? (
        <div className="flex w-full items-center gap-1.5 rounded-xl bg-primary/15 px-2.5 py-1.5 text-xs font-medium text-primary">
          <CalendarCheck className="size-3.5 shrink-0 text-primary" />
          <span>
            {t("termCardClassesCount", { count: availableClassesCount })}
          </span>
        </div>
      ) : (
        <div className="flex w-full items-center gap-1.5 rounded-xl bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground">
          <CalendarX className="size-3.5 shrink-0 text-muted-foreground" />
          <span>{t("termCardNoClasses")}</span>
        </div>
      )}
    </Button>
  )
}
