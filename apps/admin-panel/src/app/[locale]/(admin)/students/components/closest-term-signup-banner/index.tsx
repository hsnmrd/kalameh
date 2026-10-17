"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarCheck, Clock, Bookmark, Plus, ListFilter } from "lucide-react"
import {
  findClosestSignupTerm,
  type TermDto,
  type TermLifecycleSettings,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface ClosestTermSignupBannerProps {
  terms: TermDto[]
  instituteSettings?: TermLifecycleSettings
  onFilterWishlist?: () => void
  onAddStudent?: () => void
  isWishlistActive?: boolean
  className?: string
}

export function ClosestTermSignupBanner({
  terms,
  instituteSettings,
  onFilterWishlist,
  onAddStudent,
  isWishlistActive = false,
  className,
}: ClosestTermSignupBannerProps) {
  const t = useTranslations("students.closestTerm")

  const closest = React.useMemo(() => {
    return findClosestSignupTerm(terms, instituteSettings)
  }, [terms, instituteSettings])

  if (!terms || terms.length === 0) {
    return null
  }

  const { term, isRegistrationOpen, daysUntilEndRegistration } = closest

  if (isRegistrationOpen && term) {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-foreground shadow-xs sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {t("registeringTitle", { termTitle: term.title })}
              </h3>
              <Badge
                variant="outline"
                className="border-primary/40 bg-primary/10 text-xs font-medium text-primary"
              >
                {t("badgeRegistering")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("registeringSubtitle", {
                termTitle: term.title,
                days: daysUntilEndRegistration ?? 0,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onAddStudent && (
            <Button
              type="button"
              size="sm"
              onClick={onAddStudent}
              className="h-9 gap-1.5 rounded-xl px-3 text-xs"
            >
              <Plus className="size-3.5" />
              <span>{t("registerAction")}</span>
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (term) {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-foreground shadow-xs sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Clock className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {t("wishlistTitle", { nextTermTitle: term.title })}
              </h3>
              <Badge
                variant="outline"
                className="border-warning/40 bg-warning/15 text-xs font-medium text-warning"
              >
                <Bookmark className="me-1 size-3" />
                {t("badgeWishlist")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("wishlistSubtitle", { nextTermTitle: term.title })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onFilterWishlist && (
            <Button
              type="button"
              variant={isWishlistActive ? "default" : "outline"}
              size="sm"
              onClick={onFilterWishlist}
              className="h-9 gap-1.5 rounded-xl px-3 text-xs"
            >
              <ListFilter className="size-3.5" />
              <span>{t("viewWishlist")}</span>
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 p-4 text-foreground shadow-xs sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Clock className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("noTermTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">{t("noTermSubtitle")}</p>
        </div>
      </div>
      {onFilterWishlist && (
        <Button
          type="button"
          variant={isWishlistActive ? "default" : "outline"}
          size="sm"
          onClick={onFilterWishlist}
          className="h-9 gap-1.5 self-end rounded-xl px-3 text-xs sm:self-center"
        >
          <ListFilter className="size-3.5" />
          <span>{t("viewWishlist")}</span>
        </Button>
      )}
    </div>
  )
}
