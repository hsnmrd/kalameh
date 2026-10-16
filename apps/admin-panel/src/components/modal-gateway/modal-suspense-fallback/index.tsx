"use client"

import * as React from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"

export function ModalSuspenseFallback() {
  return (
    <div
      aria-label="بارگذاری پنجره"
      aria-busy="true"
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/60 p-4 backdrop-blur-xs duration-150 fade-in-0 sm:p-6"
    >
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <Skeleton className="h-6 w-36 rounded-md" />
          <div className="flex size-8 items-center justify-center">
            <Spinner className="size-4 text-muted-foreground" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
          <Skeleton className="h-11 w-20 rounded-xl" />
          <Skeleton className="h-11 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
