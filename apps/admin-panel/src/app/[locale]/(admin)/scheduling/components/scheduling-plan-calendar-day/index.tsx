"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Clock3, Coffee } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"
import { SchedulingPlanCalendarClassCard } from "../scheduling-plan-calendar-class-card"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

interface SchedulingPlanCalendarDayProps {
  dayKey: string
  dayLabel: string
  proposals: Proposal[]
  canEdit: boolean
}

export function SchedulingPlanCalendarDay({
  dayKey,
  dayLabel,
  proposals,
  canEdit,
}: SchedulingPlanCalendarDayProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const hasClasses = proposals.length > 0

  const timeSlots = React.useMemo(() => {
    const slotsMap = new Map<
      string,
      { startTime: string; endTime: string; proposals: Proposal[] }
    >()
    for (const proposal of proposals) {
      const key = `${proposal.startTime}-${proposal.endTime}`
      if (!slotsMap.has(key)) {
        slotsMap.set(key, {
          startTime: proposal.startTime,
          endTime: proposal.endTime,
          proposals: [],
        })
      }
      slotsMap.get(key)!.proposals.push(proposal)
    }
    return Array.from(slotsMap.values()).sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    )
  }, [proposals])

  return (
    <section
      aria-label={`${dayLabel} (${proposals.length} classes)`}
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/60"
    >
      {/* Day Column Header */}
      <header className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2.5">
        <h4 className="text-sm font-bold text-foreground">{dayLabel}</h4>
        {hasClasses ? (
          <Badge variant="secondary" className="text-xs">
            {t("calendarView.classesCount", {
              count: formatNumber(proposals.length, locale),
            })}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {t("calendarView.weekendOff")}
          </Badge>
        )}
      </header>

      {/* Day Column Body: Grouped by Time Slots */}
      <div className="flex flex-1 flex-col gap-3 p-2.5">
        {hasClasses ? (
          timeSlots.map((slot) => (
            <div
              key={`${dayKey}-${slot.startTime}-${slot.endTime}`}
              className="flex flex-col gap-1.5"
            >
              {/* Time Slot Header */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/50 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock3
                    aria-hidden
                    className="size-3 text-muted-foreground"
                  />
                  <span className="tabular-nums">
                    {t("timeRange", {
                      start: slot.startTime,
                      end: slot.endTime,
                    })}
                  </span>
                </div>
                {slot.proposals.length > 1 && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    {t("calendarView.classesCount", {
                      count: formatNumber(slot.proposals.length, locale),
                    })}
                  </Badge>
                )}
              </div>

              {/* Proposals in this Time Slot */}
              <div className="flex flex-col gap-2">
                {slot.proposals.map((proposal) => (
                  <SchedulingPlanCalendarClassCard
                    key={`${proposal.id}-${dayKey}`}
                    proposal={proposal}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-36 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-center">
            <Coffee aria-hidden className="size-5 text-muted-foreground/60" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("calendarView.noClasses")}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
