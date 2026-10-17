"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import {
  calculateTermLifecycleStatus,
  calculateTermLifecycleStatuses,
  type TermDto,
  type TermLifecycleStatus,
} from "@workspace/types"

export interface TermStatusBadgeProps {
  status?: TermLifecycleStatus
  statuses?: TermLifecycleStatus[]
  term?: TermDto
  allTerms?: TermDto[]
  isActive?: boolean
  className?: string
  single?: boolean
}

export function TermStatusBadge({
  status,
  statuses,
  term,
  allTerms,
  isActive,
  className,
  single = false,
}: TermStatusBadgeProps) {
  const t = useTranslations("terms.status")

  const computedStatuses: TermLifecycleStatus[] = React.useMemo(() => {
    if (statuses && statuses.length > 0) return statuses
    if (status) return [status]

    if (term?.lifecycleStatuses && term.lifecycleStatuses.length > 0) {
      return term.lifecycleStatuses
    }
    if (term?.lifecycleStatus && single) {
      return [term.lifecycleStatus]
    }
    if (term) {
      if (single) {
        return [calculateTermLifecycleStatus(term, allTerms)]
      }
      return calculateTermLifecycleStatuses(term, allTerms)
    }
    if (isActive !== undefined) {
      return [isActive ? "ONGOING" : "INACTIVE"]
    }
    return ["INACTIVE"]
  }, [statuses, status, term, allTerms, isActive, single])

  // Filter out redundant "ACTIVE" if "ONGOING" is present to prevent duplicate badges
  const displayStatuses = React.useMemo(() => {
    const list = computedStatuses.filter(Boolean)
    if (list.includes("ONGOING") && list.includes("ACTIVE")) {
      return list.filter((s) => s !== "ACTIVE")
    }
    return list
  }, [computedStatuses])

  const renderBadge = (st: TermLifecycleStatus) => {
    switch (st) {
      case "ACTIVE":
      case "ONGOING":
        return (
          <Badge
            key={st}
            variant="outline"
            className={cn(
              "border-success/25 bg-success/10 font-medium text-success",
              className
            )}
          >
            <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-success" />
            {t("ongoing")}
          </Badge>
        )

      case "REGISTERING":
        return (
          <Badge
            key={st}
            variant="outline"
            className={cn(
              "border-primary/25 bg-primary/10 font-medium text-primary",
              className
            )}
          >
            <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            {t("registering")}
          </Badge>
        )

      case "CLASSES_STARTED":
        return (
          <Badge
            key={st}
            variant="outline"
            className={cn(
              "border-sky-500/25 bg-sky-500/10 font-medium text-sky-600 dark:text-sky-400",
              className
            )}
          >
            <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-sky-500" />
            {t("classesStarted")}
          </Badge>
        )

      case "FINAL_EXAMS":
        return (
          <Badge
            key={st}
            variant="outline"
            className={cn(
              "border-amber-500/25 bg-amber-500/10 font-medium text-amber-600 dark:text-amber-400",
              className
            )}
          >
            <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
            {t("finalExams")}
          </Badge>
        )

      case "GRADING":
        return (
          <Badge
            key={st}
            variant="outline"
            className={cn(
              "border-orange-500/25 bg-orange-500/10 font-medium text-orange-600 dark:text-orange-400",
              className
            )}
          >
            <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
            {t("grading")}
          </Badge>
        )

      case "UPCOMING":
        return (
          <Badge
            key={st}
            variant="outline"
            className={cn(
              "border-warning/25 bg-warning/10 font-medium text-warning",
              className
            )}
          >
            <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
            {t("upcoming")}
          </Badge>
        )

      case "COMPLETED":
        return (
          <Badge
            key={st}
            variant="outline"
            className={cn(
              "border-border/60 bg-muted/60 font-medium text-muted-foreground",
              className
            )}
          >
            <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
            {t("completed")}
          </Badge>
        )

      case "INACTIVE":
      default:
        return (
          <Badge
            key={st}
            variant="outline"
            className={cn(
              "border-destructive/20 bg-destructive/10 font-medium text-destructive",
              className
            )}
          >
            <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
            {t("inactive")}
          </Badge>
        )
    }
  }

  if (displayStatuses.length === 1) {
    return renderBadge(displayStatuses[0]!)
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayStatuses.map((st) => renderBadge(st))}
    </div>
  )
}
