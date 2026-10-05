"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CalendarDays,
  CalendarPlus,
  GraduationCap,
  Cpu,
  CheckCheck,
} from "lucide-react"
import {
  operatingPhasesResource,
  termsResource,
  studentsResource,
  schedulingResource,
  classesResource,
} from "@/lib/api"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@workspace/ui/components/carousel"
import { useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import type { SetupStep, SetupSubstep } from "./types"
import { SetupFlowHeader } from "./setup-flow-header"
import { SetupCarouselCard } from "./setup-carousel-card"

export interface SetupFlowProps {
  instituteId: string
  classesCount?: number
}

export function SetupFlow({ instituteId, classesCount = 0 }: SetupFlowProps) {
  const isRtl = useIsRtl()

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
        icon: CalendarDays,
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
        icon: CalendarPlus,
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
        icon: GraduationCap,
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
        icon: Cpu,
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
  const currentStepIndex = steps.findIndex((s) => s.status === "current")
  const startIndex = currentStepIndex >= 0 ? currentStepIndex : 0

  return (
    <div className="flex flex-col gap-3">
      <Carousel
        opts={{
          direction: isRtl ? "rtl" : "ltr",
          align: "start",
          startIndex,
        }}
        className="w-full"
      >
        <SetupFlowHeader
          completedCount={completedCount}
          totalSteps={steps.length}
          actions={
            <div className="flex items-center gap-1">
              <CarouselPrevious className="static size-8 translate-x-0 translate-y-0" />
              <CarouselNext className="static size-8 translate-x-0 translate-y-0" />
            </div>
          }
        />

        <div className="mt-2">
          <CarouselContent className="-ms-3 py-1">
            {steps.map((step) => {
              const isComp = step.status === "completed"
              const isCurr = step.status === "current"

              return (
                <CarouselItem
                  key={step.id}
                  className={cn(
                    "ps-3",
                    isComp
                      ? "basis-[75%] sm:basis-[42%] md:basis-[30%] lg:basis-[22%] xl:basis-[18%]"
                      : isCurr
                        ? "basis-full sm:basis-[70%] md:basis-[50%] lg:basis-[38%] xl:basis-[32%]"
                        : "basis-[80%] sm:basis-[48%] md:basis-[34%] lg:basis-[26%] xl:basis-[22%]"
                  )}
                >
                  <SetupCarouselCard step={step} />
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </div>
      </Carousel>
    </div>
  )
}
