"use client"

import * as React from "react"
import { JALALI_MONTHS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface MonthsSelectorProps {
  value: number[]
  onChange: (months: number[]) => void
  disabled?: boolean
  hasError?: boolean
}

export function MonthsSelector({
  value = [],
  onChange,
  disabled,
  hasError = false,
}: MonthsSelectorProps) {
  const isInvalid = Boolean(hasError && (!value || value.length === 0))

  const toggleMonth = (monthId: number) => {
    if (disabled) return
    if (value.includes(monthId)) {
      onChange(value.filter((m) => m !== monthId))
    } else {
      onChange([...value, monthId].sort((a, b) => a - b))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Months 1-12 Chips Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {JALALI_MONTHS.map((m) => {
          const isSelected = value.includes(m.id)
          return (
            <Button
              key={m.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              disabled={disabled}
              aria-invalid={isInvalid ? "true" : undefined}
              onClick={() => toggleMonth(m.id)}
              className={cn(
                "h-auto flex-col gap-0.5 rounded-xl py-2 text-center text-xs transition-colors",
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : isInvalid
                    ? "border-destructive/80 bg-destructive/5 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                    : "bg-background text-foreground hover:bg-muted"
              )}
            >
              <span>{m.nameFa}</span>
              <span
                className={cn(
                  "text-[10px]",
                  isSelected
                    ? "text-primary-foreground/80"
                    : isInvalid
                      ? "text-destructive/70"
                      : "text-muted-foreground"
                )}
              >
                {m.seasonFa}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
