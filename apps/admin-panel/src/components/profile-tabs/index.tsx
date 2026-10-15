"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface ProfileTabOption<T extends string = string> {
  key: T
  label: string
  count?: number
  icon?: React.ReactNode
}

export interface ProfileTabsProps<T extends string = string> {
  options: ProfileTabOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function ProfileTabs<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: ProfileTabsProps<T>) {
  return (
    <div
      className={cn(
        "no-scrollbar flex h-14 w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-border bg-muted/50 p-1.5 shadow-2xs",
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
            onClick={() => onChange(option.key)}
            className={cn(
              "h-full shrink-0 cursor-pointer gap-2 rounded-xl px-4 text-sm font-medium transition-all",
              isSelected
                ? "bg-card text-foreground shadow-xs hover:bg-card"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.icon}
            <span>{option.label}</span>
            {typeof option.count === "number" && (
              <span
                className={cn(
                  "ms-1 rounded-full px-2 py-0.5 text-xs",
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
