"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowRightLeft, ChevronDown } from "lucide-react"
import type { SchedulingTeacherReassignmentChain } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@workspace/ui/components/carousel"
import { toast } from "@workspace/ui/components/sonner"
import { cn, formatNumber } from "@workspace/ui/lib/utils"
import { schedulingResource } from "@/lib/api/resources/scheduling.resource"
import { useActiveInstitute } from "@/lib/stores"
import { ReassignmentChainCard } from "./reassignment-chain-card"

interface SchedulingTeacherReassignmentAnalysisProps {
  chains: SchedulingTeacherReassignmentChain[]
  targetCourseTitle: string
  planId?: string
  planStatus?: string
  unresolvedRequirementId?: string
  onApplyChainSuccess?: () => void
}

export function SchedulingTeacherReassignmentAnalysis({
  chains,
  targetCourseTitle,
  planId,
  planStatus,
  unresolvedRequirementId,
  onApplyChainSuccess,
}: SchedulingTeacherReassignmentAnalysisProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [applyingChainKey, setApplyingChainKey] = React.useState<string | null>(
    null
  )
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(1)

  React.useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap() + 1)

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1)
    }

    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  const canApply =
    Boolean(planId) &&
    (!planStatus || ["DRAFT", "SELECTED"].includes(planStatus))

  const applyChainMutation = useMutation({
    ...schedulingResource.applyReassignmentChain.toMutation(),
    onSuccess: (updatedPlan, variables) => {
      toast.success(t("reassignment.applyChainSuccess"))
      queryClient.setQueryData(
        schedulingResource.planDetail.key({
          planId: updatedPlan.id,
          ...(variables.instituteId
            ? { instituteId: variables.instituteId }
            : {}),
        }),
        updatedPlan
      )
      queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.baseKey(),
      })
      onApplyChainSuccess?.()
    },
    onSettled: () => {
      setApplyingChainKey(null)
    },
  })

  const handleApplyChain = (chain: SchedulingTeacherReassignmentChain) => {
    if (!planId || applyChainMutation.isPending) return
    setApplyingChainKey(chain.key)
    applyChainMutation.mutate({
      planId,
      ...(activeInstituteId ? { instituteId: activeInstituteId } : {}),
      body: {
        chainKey: chain.key,
        ...(unresolvedRequirementId ? { unresolvedRequirementId } : {}),
        reassignments: chain.reassignments.map((r) => ({
          proposalId: r.proposalId,
          toTeacherId: r.toTeacher.id,
        })),
        targetAssignment: {
          teacherId: chain.targetAssignment.teacher.id,
          classroomId: chain.targetAssignment.classroom?.id ?? null,
          deliveryMode: chain.targetAssignment.deliveryMode,
          daysOfWeek: chain.targetAssignment.daysOfWeek,
          startTime: chain.targetAssignment.startTime,
          endTime: chain.targetAssignment.endTime,
        },
      },
    })
  }

  if (chains.length === 0) {
    return (
      <section
        aria-label={t("reassignment.title")}
        className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowRightLeft
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="font-semibold text-foreground">
              {t("reassignment.title")}:
            </span>
            <span>{t("reassignment.noChainTitle")}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>
              {isExpanded
                ? t("reassignment.hideDetails")
                : t("reassignment.showDetails")}
            </span>
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3.5 shrink-0 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-2.5 border-t border-border/40 pt-2.5 text-xs leading-5 text-muted-foreground">
            <p>{t("reassignment.description")}</p>
            <p className="mt-1 text-muted-foreground/80">
              {t("reassignment.noChainDescription")}
            </p>
          </div>
        )}
      </section>
    )
  }

  const hasMultiple = chains.length > 1

  return (
    <section aria-label={t("reassignment.title")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <ArrowRightLeft
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-foreground"
          />
          <div>
            <h5 className="text-xs font-semibold text-foreground">
              {t("reassignment.title")}
            </h5>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              {t("reassignment.description")}
            </p>
          </div>
        </div>
        <Badge variant="success">
          {t("reassignment.chainCount", {
            count: formatNumber(chains.length, locale),
          })}
        </Badge>
      </div>

      <div className="mt-3 w-full">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            direction: locale === "fa" ? "rtl" : "ltr",
          }}
          className="w-full"
        >
          {hasMultiple && (
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("staffingFallback.teacherCarouselCounter", {
                  current: formatNumber(current, locale),
                  total: formatNumber(chains.length, locale),
                })}
              </span>
              <div className="flex items-center gap-1.5">
                <CarouselPrevious
                  type="button"
                  className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                />
                <CarouselNext
                  type="button"
                  className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
                />
              </div>
            </div>
          )}

          <CarouselContent className="-ms-3">
            {chains.map((chain) => (
              <CarouselItem
                key={chain.key}
                data-testid="reassignment-chain-slide"
                className={cn(
                  "ps-3",
                  hasMultiple ? "basis-[90%] sm:basis-[85%]" : "basis-full"
                )}
              >
                <ReassignmentChainCard
                  chain={chain}
                  targetCourseTitle={targetCourseTitle}
                  canApply={canApply}
                  isPending={applyChainMutation.isPending}
                  isApplying={applyingChainKey === chain.key}
                  onApply={handleApplyChain}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
