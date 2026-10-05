"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  operatingPhasesResource,
  termsResource,
  studentsResource,
  schedulingResource,
  classesResource,
} from "@/lib/api"
import {
  Collapsible,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"
import type { SetupStep, SetupSubstep } from "./types"
import { SetupFlowHeader } from "./setup-flow-header"
import { SetupCurrentActionBanner } from "./setup-current-action-banner"
import { SetupStepItem } from "./setup-step-item"

export interface SetupFlowProps {
  instituteId: string
  classesCount?: number
}

export function SetupFlow({ instituteId, classesCount = 0 }: SetupFlowProps) {
  const { data: operatingPhases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({ instituteId }),
    enabled: Boolean(instituteId),
  })

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery({ instituteId }),
    enabled: Boolean(instituteId),
  })

  const { data: students = [] } = useQuery({
    ...studentsResource.list.toQuery({ instituteId }),
    enabled: Boolean(instituteId),
  })

  const { data: schedulingTerms = [] } = useQuery({
    ...schedulingResource.terms.toQuery({ instituteId }),
    enabled: Boolean(instituteId),
  })

  const { data: classes = [] } = useQuery({
    ...classesResource.list.toQuery({ instituteId }),
    enabled: Boolean(instituteId),
  })

  // Evaluate step completion
  const isStep1Done = operatingPhases.length > 0
  const isStep2Done = terms.length > 0
  const isStep3Done = students.length > 0

  const isSubstep1Done = schedulingTerms.some(
    (t) => t.requirementsCount > 0 || t.schedulingStatus !== "NO_REQUIREMENTS"
  )
  const isSubstep2Done = schedulingTerms.some(
    (t) =>
      t.latestRun !== null ||
      ["GENERATING", "SCHEDULED", "PUBLISHED"].includes(t.schedulingStatus)
  )
  const isSubstep3Done = schedulingTerms.some((t) =>
    ["SCHEDULED", "PUBLISHED"].includes(t.schedulingStatus)
  )

  const isStep4Done = isSubstep3Done
  const isStep5Done = classes.length > 0 || classesCount > 0

  const schedulingSubsteps: SetupSubstep[] = React.useMemo(
    () => [
      {
        id: "demand",
        titleKey: "substep1",
        descKey: "substep1",
        isDone: isSubstep1Done,
        href: "/classes/scheduling",
      },
      {
        id: "generate",
        titleKey: "substep2",
        descKey: "substep2",
        isDone: isSubstep2Done,
        href: "/classes/scheduling/generate",
      },
      {
        id: "select",
        titleKey: "substep3",
        descKey: "substep3",
        isDone: isSubstep3Done,
        href: "/classes/scheduling",
      },
    ],
    [isSubstep1Done, isSubstep2Done, isSubstep3Done]
  )

  const steps: SetupStep[] = React.useMemo(() => {
    const s1Status = isStep1Done ? "completed" : "current"
    const s2Status = isStep2Done
      ? "completed"
      : isStep1Done
        ? "current"
        : "pending"
    const s3Status = isStep3Done
      ? "completed"
      : isStep2Done
        ? "current"
        : "pending"
    const s4Status = isStep4Done
      ? "completed"
      : isStep3Done || isStep2Done
        ? "current"
        : "pending"
    const s5Status = isStep5Done
      ? "completed"
      : isStep4Done
        ? "current"
        : "pending"

    return [
      {
        id: "phases",
        stepNumber: 1,
        titleKey: "phases",
        descKey: "phases",
        actionHintKey: "phases",
        status: s1Status,
        primaryHref: "/operating-phases",
        actionLabelKey: "configurePhases",
      },
      {
        id: "terms",
        stepNumber: 2,
        titleKey: "terms",
        descKey: "terms",
        actionHintKey: "terms",
        status: s2Status,
        primaryHref: "/terms",
        actionLabelKey: "generateTerms",
      },
      {
        id: "students",
        stepNumber: 3,
        titleKey: "students",
        descKey: "students",
        actionHintKey: "students",
        status: s3Status,
        primaryHref: "/students",
        actionLabelKey: "manageStudents",
      },
      {
        id: "scheduling",
        stepNumber: 4,
        titleKey: "scheduling",
        descKey: "scheduling",
        actionHintKey: "scheduling",
        status: s4Status,
        primaryHref: "/classes/scheduling",
        actionLabelKey: "smartScheduling",
        substeps: schedulingSubsteps,
      },
      {
        id: "classes",
        stepNumber: 5,
        titleKey: "classes",
        descKey: "classes",
        actionHintKey: "classes",
        status: s5Status,
        primaryHref: "/classes",
        actionLabelKey: "manageClasses",
      },
    ]
  }, [
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    schedulingSubsteps,
  ])

  const completedCount = steps.filter((s) => s.status === "completed").length
  const isAllCompleted = completedCount === steps.length
  const currentStep = steps.find((s) => s.status === "current")

  const [isExpanded, setIsExpanded] = React.useState(!isAllCompleted)

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
      <SetupFlowHeader
        completedCount={completedCount}
        totalSteps={steps.length}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded((prev) => !prev)}
      />

      <SetupCurrentActionBanner
        currentStep={currentStep}
        isAllCompleted={isAllCompleted}
      />

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <div className="mt-4 flex flex-col pt-2">
            {steps.map((step, index) => (
              <SetupStepItem
                key={step.id}
                step={step}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
