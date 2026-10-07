"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import type { WheelPickerProps } from "./types"

export type { WheelPickerProps }

export function WheelPicker({
  children,
  className,
  highlightClassName,
  itemHeight = 40,
  visibleCount = 5,
}: WheelPickerProps) {
  const containerHeight = visibleCount * itemHeight
  const highlightTop = Math.floor((visibleCount - 1) / 2) * itemHeight

  return (
    <div
      style={{ height: containerHeight }}
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden select-none",
        className
      )}
    >
      {/* Central Rounded Highlight Bar spanning across all columns */}
      <div
        style={{
          top: highlightTop,
          height: itemHeight,
        }}
        className={cn(
          "pointer-events-none absolute inset-x-2 rounded-xl bg-primary/10 transition-colors",
          highlightClassName
        )}
      />

      {/* Columns Container with Top and Bottom Gradient Mask */}
      <div
        style={{
          height: containerHeight,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        }}
        className="relative z-10 flex h-full w-full items-center justify-around"
      >
        {children}
      </div>
    </div>
  )
}
