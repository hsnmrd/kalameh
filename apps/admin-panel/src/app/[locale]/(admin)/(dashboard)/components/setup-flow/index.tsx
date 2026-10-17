"use client"

import * as React from "react"
import {
  CalendarDays,
  CalendarPlus,
  GraduationCap,
  Cpu,
  CheckCheck,
} from "lucide-react"
import { useSetupFlowStatus } from "@/lib/hooks"
import { cn } from "@workspace/ui/lib/utils"
import type { SetupStep, SetupSubstep } from "./types"
import { SetupFlowHeader } from "./setup-flow-header"
import { SetupStepRow } from "./setup-step-row"

export interface SetupFlowProps {
  instituteId: string
  classesCount?: number
  className?: string
}

export function SetupFlow({
  instituteId,
  classesCount = 0,
  className,
}: SetupFlowProps) {
  const {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    isSubstep1Done,
    isSubstep2Done,
    isSubstep3Done,
  } = useSetupFlowStatus({ instituteId, classesCount })

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
    const stepDoneFlags = [
      isStep1Done,
      isStep2Done,
      isStep3Done,
      isStep4Done,
      isStep5Done,
    ]

    // Strictly ONE current step: the first uncompleted step in sequence
    const firstIncompleteIndex = stepDoneFlags.findIndex((done) => !done)

    const getStatus = (index: number): "completed" | "current" | "pending" => {
      if (stepDoneFlags[index]) {
        return "completed"
      }
      if (index === firstIncompleteIndex) {
        return "current"
      }
      return "pending"
    }

    return [
      {
        id: "phases",
        stepNumber: 1,
        titleKey: "phases",
        descKey: "phases",
        actionHintKey: "phases",
        status: getStatus(0),
        primaryHref: "/operating-phases",
        actionLabelKey: "configurePhases",
        icon: CalendarDays,
      },
      {
        id: "terms",
        stepNumber: 2,
        titleKey: "terms",
        descKey: "terms",
        actionHintKey: "terms",
        status: getStatus(1),
        primaryHref: "/terms",
        actionLabelKey: "generateTerms",
        icon: CalendarPlus,
      },
      {
        id: "students",
        stepNumber: 3,
        titleKey: "students",
        descKey: "students",
        actionHintKey: "students",
        status: getStatus(2),
        primaryHref: "/students",
        actionLabelKey: "manageStudents",
        icon: GraduationCap,
      },
      {
        id: "scheduling",
        stepNumber: 4,
        titleKey: "scheduling",
        descKey: "scheduling",
        actionHintKey: "scheduling",
        status: getStatus(3),
        primaryHref: "/classes/scheduling",
        actionLabelKey: "smartScheduling",
        icon: Cpu,
        substeps: schedulingSubsteps,
      },
      {
        id: "classes",
        stepNumber: 5,
        titleKey: "classes",
        descKey: "classes",
        actionHintKey: "classes",
        status: getStatus(4),
        primaryHref: "/classes",
        actionLabelKey: "manageClasses",
        icon: CheckCheck,
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

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 lg:w-1/2 lg:max-w-[50%]",
        className
      )}
    >
      <SetupFlowHeader
        completedCount={completedCount}
        totalSteps={steps.length}
      />

      <div className="flex flex-col gap-2 sm:gap-2.5">
        {steps.map((step) => (
          <SetupStepRow key={step.id} step={step} />
        ))}
      </div>
    </div>
  )
}
