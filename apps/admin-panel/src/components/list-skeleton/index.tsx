"use client"

import * as React from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

export interface ListSkeletonProps {
  rows?: number
  className?: string
  showSpinner?: boolean
}

export function ListSkeleton({
  rows = 5,
  className,
  showSpinner = false,
}: ListSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("flex flex-col divide-y divide-border/60", className)}
    >
      {showSpinner && (
        <div className="flex items-center justify-center py-2">
          <Spinner className="size-4 text-muted-foreground" />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5 sm:py-4">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-36 rounded-md sm:w-48" />
            <Skeleton className="h-3 w-24 rounded-md sm:w-32" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  )
}
