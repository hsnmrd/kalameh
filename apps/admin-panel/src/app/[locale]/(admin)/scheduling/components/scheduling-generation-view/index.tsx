"use client"

import * as React from "react"
import type { SchedulingRunDto } from "@workspace/types"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import { SchedulingGenerationForm } from "../scheduling-generation-form"
import { SchedulingRunStatusPanel } from "../scheduling-run-status-panel"

export interface SchedulingGenerationViewProps {
  activeRun: SchedulingRunDto | null
  termOptions?: ComboboxOption[]
  defaultTermId?: string
  onCreatedRun: (run: SchedulingRunDto) => void
  onResetRun: () => void
  onNavigateToDemand?: () => void
}

export function SchedulingGenerationView({
  activeRun,
  termOptions,
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
      termOptions={termOptions}
      defaultTermId={defaultTermId}
      onCreated={onCreatedRun}
      onNavigateToDemand={onNavigateToDemand}
    />
  )
}
