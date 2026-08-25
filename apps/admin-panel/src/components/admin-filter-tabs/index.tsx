"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface FilterTabOption<T extends string = string> {
  key: T
  label: string
  count?: number
}

export interface AdminFilterTabsProps<T extends string = string> {
  options: FilterTabOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function AdminFilterTabs<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: AdminFilterTabsProps<T>) {
  return (
    <div
      className={cn(
        "flex h-14 flex-wrap items-center gap-1.5 rounded-2xl border border-border bg-muted/50 p-1.5 shadow-2xs",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.key
        return (
          <Button
            key={option.key}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(option.key)}
            className={cn(
              "h-full cursor-pointer rounded-xl px-3.5 text-sm font-medium transition-all",
              isSelected
                ? "bg-card text-foreground shadow-xs hover:bg-card"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>{option.label}</span>
            {typeof option.count === "number" && (
              <span
                className={cn(
                  "ms-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                  isSelected
                    ? "bg-muted font-semibold text-foreground"
                    : "bg-background/80 text-muted-foreground"
                )}
              >
                {option.count}
              </span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
