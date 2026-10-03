"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Link, useIsRtl } from "@/i18n/routing"
import { useHeaderActions } from "../admin-base-layout/header-actions-context"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[]
  backHref?: string
  backLabel?: string
  className?: string
}

export function AdminBreadcrumb({
  items = [],
  backHref,
  backLabel,
  className,
}: AdminBreadcrumbProps) {
  const { setBackNavigation } = useHeaderActions()

  React.useEffect(() => {
    if (backHref) {
      setBackNavigation({ backHref, backLabel })
      return () => setBackNavigation(null)
    }
  }, [backHref, backLabel, setBackNavigation])

  const isRtl = useIsRtl()
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight

  if (items.length === 0) return null

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 sm:gap-3", className)}
    >
      {items.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1
            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronIcon className="size-3 text-muted-foreground/50" />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn(isLast && "font-medium text-foreground")}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            )
          })}
        </nav>
      )}
    </div>
  )
}
