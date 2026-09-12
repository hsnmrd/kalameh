"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import {
  calculateTermLifecycleStatus,
  type TermDto,
  type TermLifecycleStatus,
} from "@workspace/types"

export interface TermStatusBadgeProps {
  status?: TermLifecycleStatus
  term?: TermDto
  allTerms?: TermDto[]
  isActive?: boolean
  className?: string
}

export function TermStatusBadge({
  status,
  term,
  allTerms,
  isActive,
  className,
}: TermStatusBadgeProps) {
  const t = useTranslations("terms.status")

  const computedStatus: TermLifecycleStatus = React.useMemo(() => {
    if (status) return status
    if (term?.lifecycleStatus) return term.lifecycleStatus
    if (term) return calculateTermLifecycleStatus(term, allTerms)
    if (isActive !== undefined) return isActive ? "ACTIVE" : "INACTIVE"
    return "INACTIVE"
  }, [status, term, allTerms, isActive])

  switch (computedStatus) {
    case "ACTIVE":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-success/25 bg-success/10 font-medium text-success",
            className
          )}
        >
          <span className="me-1.5 size-1.5 shrink-0 rounded-full bg-success" />
          {t("active")}
        </Badge>
      )

    case "REGISTERING":
      return (
        <Badge
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

    case "UPCOMING":
      return (
        <Badge
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
