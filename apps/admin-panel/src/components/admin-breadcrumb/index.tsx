"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Link, useIsRtl } from "@/i18n/routing"

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
  const isRtl = useIsRtl()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2 sm:gap-3", className)}
    >
      {backHref && (
        <Button
          render={<Link href={backHref} />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="h-8 cursor-pointer gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <BackIcon className="size-3.5" />
          {backLabel && <span>{backLabel}</span>}
        </Button>
      )}

      {backHref && items.length > 0 && (
        <div className="hidden h-4 w-px bg-border/60 sm:block" />
      )}

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
