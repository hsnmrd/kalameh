"use client"

import * as React from "react"
import { Spinner } from "@workspace/ui/components/spinner"

export function ModalSuspenseFallback() {
  return (
    <div
      aria-label="بارگذاری پنجره"
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/60 backdrop-blur-xs duration-150 fade-in-0"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-card p-3 shadow-lg">
        <Spinner className="size-6 text-foreground" />
      </div>
    </div>
  )
}
