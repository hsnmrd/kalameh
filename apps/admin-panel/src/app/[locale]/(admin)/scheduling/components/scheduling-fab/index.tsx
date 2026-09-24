"use client"

import type { SchedulingTab } from "../scheduling-filter"

export interface SchedulingFabProps {
  activeTab?: SchedulingTab
  termId?: string
  hasDemands?: boolean
  onCalculateDemand?: () => void
  onApplyDemand?: () => void
  registeredCount?: number
}

export function SchedulingFab(_props: SchedulingFabProps) {
  return null
}
