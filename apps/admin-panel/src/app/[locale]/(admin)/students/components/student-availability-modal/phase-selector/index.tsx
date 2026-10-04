"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import {
  isOperatingPhaseCurrent,
  type OperatingPhaseWithSlots,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface PhaseSelectorProps {
  phases: OperatingPhaseWithSlots[]
  selectedPhaseId: string
  onSelectPhase: (phaseId: string) => void
  disabled?: boolean
}

export function PhaseSelector({
  phases,
  selectedPhaseId,
  onSelectPhase,
  disabled = false,
}: PhaseSelectorProps) {
  if (phases.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {phases.map((phase) => {
          const isSelected = phase.id === selectedPhaseId
          const isCurrent = isOperatingPhaseCurrent(phase)

          return (
            <Button
              key={phase.id}
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => onSelectPhase(phase.id)}
              className={cn(
                "group relative flex h-14 min-w-[130px] flex-col items-center justify-center gap-1 rounded-2xl border px-4 transition-all",
                isSelected
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/20"
                  : "border-border/70 bg-card text-foreground hover:border-border hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground group-hover:text-foreground" />
                <span className="text-xs font-semibold">{phase.title}</span>
                {isCurrent && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    فعلی
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {phase.startTime} - {phase.endTime}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
