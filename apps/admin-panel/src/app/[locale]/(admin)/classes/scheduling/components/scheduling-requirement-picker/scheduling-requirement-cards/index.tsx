"use client"

import * as React from "react"
import type { ClassRequirementDto } from "@workspace/types"
import { SchedulingRequirementCard } from "../scheduling-requirement-card"

export interface SchedulingRequirementCardsProps {
  items: ClassRequirementDto[]
  selectedIds: string[]
  onToggle: (id: string, checked: boolean) => void
}

export function SchedulingRequirementCards({
  items,
  selectedIds,
  onToggle,
}: SchedulingRequirementCardsProps) {
  return (
    <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2">
      {items.map((item) => (
        <SchedulingRequirementCard
          key={item.id}
          item={item}
          isSelected={selectedIds.includes(item.id)}
          onToggle={(checked) => onToggle(item.id, checked)}
        />
      ))}
    </div>
  )
}
