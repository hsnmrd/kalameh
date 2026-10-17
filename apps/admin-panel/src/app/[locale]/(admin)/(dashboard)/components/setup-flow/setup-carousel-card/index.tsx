"use client"

import * as React from "react"
import type { SetupStep } from "../types"
import { SetupStepRow } from "../setup-step-row"

export interface SetupCarouselCardProps {
  step: SetupStep
}

export function SetupCarouselCard({ step }: SetupCarouselCardProps) {
  return <SetupStepRow step={step} />
}
