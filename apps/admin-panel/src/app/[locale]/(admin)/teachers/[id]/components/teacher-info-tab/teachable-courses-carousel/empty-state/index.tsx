"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { BookOpen, RotateCcw, SearchX } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface EmptyStateProps {
  isSearch?: boolean
  onReset?: () => void
}

export function EmptyState({ isSearch, onReset }: EmptyStateProps) {
  const t = useTranslations("teachers")

  if (isSearch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
        <SearchX className="size-8 text-muted-foreground" />
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {t("qualifications.noCoursesFound")}
        </p>
        {onReset ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="mt-3 gap-1.5 text-xs text-foreground"
          >
            <RotateCcw className="size-3 text-foreground" />
            <span>{t("qualifications.clearSearch")}</span>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-4 py-8 text-center">
      <BookOpen className="size-8 text-muted-foreground" />
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        {t("qualifications.profileEmpty")}
      </p>
    </div>
  )
}
