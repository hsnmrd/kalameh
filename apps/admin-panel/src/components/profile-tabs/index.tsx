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
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleTabClick = (key: T) => {
    onChange(key)
    if (typeof window !== "undefined" && containerRef.current) {
      const headerOffset = 64 // AdminHeader height is 64px (h-16)
      const rect = containerRef.current.getBoundingClientRect()
      const scrollTarget = window.pageYOffset + rect.top - headerOffset
      window.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: "smooth",
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "sticky top-16 z-20 -mx-4 w-[calc(100%+2rem)] border-y border-border/60 bg-background/95 px-4 py-2 backdrop-blur-md sm:mx-0 sm:w-full sm:px-0",
        className
      )}
    >
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
        {options.map((option) => {
          const isSelected = value === option.key
          return (
            <Button
              key={option.key}
              type="button"
              variant="ghost"
              onClick={() => handleTabClick(option.key)}
              className={cn(
                "h-11 shrink-0 cursor-pointer gap-2 rounded-xl px-4 text-sm font-semibold transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {option.icon}
              <span>{option.label}</span>
              {typeof option.count === "number" && (
                <span
                  className={cn(
                    "ms-1 rounded-full px-2 py-0.5 text-xs font-bold",
                    isSelected
                      ? "bg-primary-foreground/25 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {option.count}
                </span>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
