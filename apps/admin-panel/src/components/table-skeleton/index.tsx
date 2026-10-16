"use client"

import * as React from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

export interface TableSkeletonProps {
  rows?: number
  className?: string
  showSpinner?: boolean
}

export function TableSkeleton({
  rows = 5,
  className,
  showSpinner = true,
}: TableSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs",
        className
      )}
    >
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28 rounded-md" />
          {showSpinner && (
            <Spinner className="size-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="hidden items-center gap-8 sm:flex">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </div>

      {/* Row skeletons */}
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-4 sm:px-6"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-36 rounded-md sm:w-48" />
                <Skeleton className="h-3 w-20 rounded-md sm:w-28" />
              </div>
            </div>
            <div className="hidden items-center gap-8 sm:flex">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
