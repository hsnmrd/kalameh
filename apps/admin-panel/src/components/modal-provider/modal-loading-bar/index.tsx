"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface ModalLoadingBarProps {
  isPending: boolean
  className?: string
}

export function ModalLoadingBar({
  isPending,
  className,
}: ModalLoadingBarProps) {
  if (!isPending) return null

  return (
    <div
      role="progressbar"
      aria-label="بارگذاری پنجره"
      aria-busy="true"
      className={cn(
        "fixed inset-x-0 top-0 z-[9999] h-1 w-full overflow-hidden bg-primary/20",
        className
      )}
    >
      <div className="h-full w-full origin-left animate-pulse bg-primary" />
    </div>
  )
}
