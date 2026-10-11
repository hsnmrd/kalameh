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
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      {items.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground"
        >
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1
            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronIcon
                    className="size-3 shrink-0 text-muted-foreground/50"
                    aria-hidden
                  />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="shrink-0 whitespace-nowrap transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    title={item.label}
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      isLast
                        ? "min-w-0 truncate font-medium text-foreground"
                        : "shrink-0 whitespace-nowrap"
                    )}
                  >
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
