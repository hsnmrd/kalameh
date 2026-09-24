"use client"

import * as React from "react"
import type { SchedulingRunDto } from "@workspace/types"
import { SchedulingGenerationForm } from "../scheduling-generation-form"
import { SchedulingRunStatusPanel } from "../scheduling-run-status-panel"

export interface SchedulingGenerationViewProps {
  activeRun: SchedulingRunDto | null
  defaultTermId?: string
  onCreatedRun: (run: SchedulingRunDto) => void
  onResetRun: () => void
  onNavigateToDemand?: () => void
}

export function SchedulingGenerationView({
  activeRun,
  defaultTermId,
  onCreatedRun,
  onResetRun,
  onNavigateToDemand,
}: SchedulingGenerationViewProps) {
  if (activeRun) {
    return <SchedulingRunStatusPanel run={activeRun} onReset={onResetRun} />
  }

  return (
    <SchedulingGenerationForm
      defaultTermId={defaultTermId}
      onCreated={onCreatedRun}
      onNavigateToDemand={onNavigateToDemand}
    />
  )
}
