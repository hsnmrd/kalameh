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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
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
  const [api, setApi] = React.useState<CarouselApi>()

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

  const [selectedIndex, setSelectedIndex] = React.useState(startIndex)

  React.useEffect(() => {
    if (!api) return

    setSelectedIndex(api.selectedScrollSnap())

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap())
    }

    api.on("select", onSelect)
    api.on("reInit", onSelect)

    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  return (
    <div className="flex flex-col gap-3">
      <Carousel
        orientation="vertical"
        setApi={setApi}
        opts={{
          align: "center",
          containScroll: false,
          startIndex,
        }}
        className="w-full"
      >
        <SetupFlowHeader
          completedCount={completedCount}
          totalSteps={steps.length}
        />

        <div className="mt-2 flex items-center gap-3">
          {/* Main vertical carousel area (Start in RTL = right) */}
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <CarouselContent className="h-[210px] sm:h-[220px]">
              {steps.map((step, index) => {
                const isSelected = index === selectedIndex

                return (
                  <CarouselItem
                    key={step.id}
                    onClick={() => api?.scrollTo(index)}
                    className={cn(
                      "basis-[80%] py-1.5 transition-all duration-300",
                      isSelected
                        ? "scale-100 opacity-100"
                        : "scale-[0.98] cursor-pointer opacity-50 hover:opacity-80"
                    )}
                  >
                    <SetupCarouselCard step={step} />
                  </CarouselItem>
                )
              })}
            </CarouselContent>
          </div>

          {/* Navigation vertical arrow buttons (End in RTL = left, matching design) */}
          <div className="flex shrink-0 flex-col gap-1.5">
            <CarouselPrevious className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-full border border-border/80 bg-background/90 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
            <CarouselNext className="static size-8 translate-x-0 translate-y-0 scale-100 rounded-full border border-border/80 bg-background/90 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
          </div>
        </div>
      </Carousel>
    </div>
  )
}
