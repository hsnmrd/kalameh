"use client"

import * as React from "react"
import {
  CalendarDays,
  CalendarPlus,
  GraduationCap,
  Cpu,
  CheckCheck,
  ChevronUp,
  ChevronDown,
  Layers,
} from "lucide-react"
import { useSetupFlowStatus } from "@/lib/hooks"
import { Button } from "@workspace/ui/components/button"
import { useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import type { SetupStep, SetupSubstep } from "./types"
import { SetupFlowHeader } from "./setup-flow-header"
import { SetupCarouselCard } from "./setup-carousel-card"

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
  const isRtl = useIsRtl()

  const {
    isStep1Done,
    isStep2Done,
    isStep3Done,
    isStep4Done,
    isStep5Done,
    isSubstep1Done,
    isSubstep2Done,
    isSubstep3Done,
    firstIncompleteIndex,
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
  const currentStepIndex = steps.findIndex((s) => s.status === "current")
  const startIndex = currentStepIndex >= 0 ? currentStepIndex : 0

  const [activeIndex, setActiveIndex] = React.useState(startIndex)
  const [isExpanded, setIsExpanded] = React.useState(false)

  React.useEffect(() => {
    setActiveIndex(startIndex)
  }, [startIndex])

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => Math.min(steps.length - 1, prev + 1))
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2.5 lg:w-1/2 lg:max-w-[50%]",
        className
      )}
    >
      <SetupFlowHeader
        completedCount={completedCount}
        totalSteps={steps.length}
        actions={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-7 cursor-pointer gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Layers className="size-3.5" />
            <span>{isExpanded ? "جمع کردن پشته" : "مشاهده همه"}</span>
          </Button>
        }
      />

      {isExpanded ? (
        <div className="mt-2 flex flex-col gap-3">
          {steps.map((step) => (
            <div
              key={step.id}
              data-slot="carousel-item"
              className="min-h-[175px] w-full"
            >
              <SetupCarouselCard step={step} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2.5 ltr:flex-row-reverse rtl:flex-row">
          {/* iOS Notifications Stack Container */}
          <div className="relative h-[220px] min-w-0 flex-1">
            {steps.map((step, index) => {
              const offset = index - activeIndex

              let stackClass = ""
              let isClickable = false

              if (offset === 0) {
                // Top active card
                stackClass =
                  "z-30 translate-y-0 scale-100 opacity-100 shadow-md pointer-events-auto"
              } else if (offset === 1) {
                // 1st card peeking underneath
                stackClass =
                  "z-20 translate-y-3.5 scale-x-[0.94] opacity-85 shadow-xs hover:opacity-100 cursor-pointer pointer-events-auto"
                isClickable = true
              } else if (offset === 2) {
                // 2nd card peeking further underneath
                stackClass =
                  "z-10 translate-y-7 scale-x-[0.88] opacity-55 shadow-2xs hover:opacity-80 cursor-pointer pointer-events-auto"
                isClickable = true
              } else if (offset > 2) {
                // Cards hidden deeper in the stack
                stackClass =
                  "z-0 translate-y-9 scale-x-[0.82] opacity-0 pointer-events-none"
              } else {
                // Previously passed cards (offset < 0)
                stackClass =
                  "z-0 -translate-y-4 scale-x-[0.94] opacity-0 pointer-events-none"
              }

              return (
                <div
                  key={step.id}
                  data-slot="carousel-item"
                  onClick={
                    isClickable ? () => setActiveIndex(index) : undefined
                  }
                  className={cn(
                    "absolute inset-x-0 top-0 h-[175px] origin-top transition-all duration-300 ease-out",
                    stackClass
                  )}
                >
                  <SetupCarouselCard step={step} />
                </div>
              )
            })}
          </div>

          {/* Vertical Stack Navigation Controls */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={activeIndex === 0}
              aria-label="Previous slide"
              className="size-8 rounded-full border-border/80 bg-background shadow-xs hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronUp className="size-4" />
            </Button>

            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
              {activeIndex + 1}/{steps.length}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={activeIndex === steps.length - 1}
              aria-label="Next slide"
              className="size-8 rounded-full border-border/80 bg-background shadow-xs hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
