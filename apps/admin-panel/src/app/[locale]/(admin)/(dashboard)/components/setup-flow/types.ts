export type StepStatus = "completed" | "current" | "pending"

export interface SetupSubstep {
  id: string
  titleKey: string
  descKey: string
  isDone: boolean
  href: string
}

export interface SetupStep {
  id: "phases" | "terms" | "students" | "scheduling" | "classes"
  stepNumber: number
  titleKey: string
  descKey: string
  actionHintKey: string
  status: StepStatus
  primaryHref: string
  actionLabelKey: string
  substeps?: SetupSubstep[]
}
