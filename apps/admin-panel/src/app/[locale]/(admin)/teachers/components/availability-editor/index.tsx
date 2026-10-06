"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  calculatePhaseSlots,
  EVEN_CLASS_DAYS,
  isAvailabilityCoveringSlot,
  ODD_CLASS_DAYS,
  subtractSlotFromAvailability,
  WEEK_DAYS,
  type PhaseGeneratedSlot,
  type TeacherAvailabilityInput,
  type WeekDay,
} from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { TermCarousel } from "./term-carousel"
import { TrackSlotRow } from "./track-slot-row"

export interface AvailabilityEditorProps {
  value: TeacherAvailabilityInput[]
  onChange: (slots: TeacherAvailabilityInput[]) => void
  selectedTermId?: string | null
  onSelectTermId?: (termId: string) => void
  instituteId?: string
  disabled?: boolean
}

interface DayTrack {
  id: string
  title: string
  subtitle?: string
  days: WeekDay[]
}

export function AvailabilityEditor({
  value = [],
  onChange,
  selectedTermId,
  onSelectTermId,
  instituteId,
  disabled = false,
}: AvailabilityEditorProps) {
  const t = useTranslations("teachers")
  const { activeInstituteId } = useActiveInstitute()
  const effectiveInstituteId = instituteId || activeInstituteId

  const { data: terms = [], isLoading: isTermsLoading } = useQuery({
    ...termsResource.list.toQuery(
      effectiveInstituteId ? { instituteId: effectiveInstituteId } : undefined
    ),
    enabled: Boolean(effectiveInstituteId),
  })

  const activeTerms = React.useMemo(() => {
    const withPhase = terms.filter((term) => Boolean(term.operatingPhase))
    const active = withPhase.filter((term) => term.isActive)
    return active.length > 0 ? active : withPhase
  }, [terms])

  const [internalTermId, setInternalTermId] = React.useState<string | null>(
    null
  )
  const currentTermId = selectedTermId ?? internalTermId

  const currentTerm = React.useMemo(() => {
    if (currentTermId) {
      const found = activeTerms.find((t) => t.id === currentTermId)
      if (found) return found
    }
    return activeTerms[0] ?? null
  }, [activeTerms, currentTermId])

  const handleSelectTerm = React.useCallback(
    (termId: string) => {
      setInternalTermId(termId)
      onSelectTermId?.(termId)
    },
    [onSelectTermId]
  )

  const currentPhase = currentTerm?.operatingPhase

  const phaseCalculation = React.useMemo(() => {
    if (!currentPhase) return null
    return calculatePhaseSlots(
      currentPhase.startTime,
      currentPhase.endTime,
      currentPhase.slotDurationMinutes,
      {
        hasBreak: currentPhase.hasBreak,
        breakStartTime: currentPhase.breakStartTime,
        breakEndTime: currentPhase.breakEndTime,
      }
    )
  }, [currentPhase])

  const standardSlots: PhaseGeneratedSlot[] = React.useMemo(() => {
    return phaseCalculation?.slots ?? []
  }, [phaseCalculation])

  const activeDays = React.useMemo<WeekDay[]>(() => {
    if (currentPhase?.daysOfWeek && currentPhase.daysOfWeek.length > 0) {
      return WEEK_DAYS.filter((d) => currentPhase.daysOfWeek!.includes(d))
    }
    return WEEK_DAYS as unknown as WeekDay[]
  }, [currentPhase])

  const tracks = React.useMemo<DayTrack[]>(() => {
    const list: DayTrack[] = []

    const evenDays = EVEN_CLASS_DAYS.filter((d) => activeDays.includes(d))
    if (evenDays.length > 0) {
      list.push({
        id: "even",
        title: t("availabilities.evenDaysTitle"),
        subtitle: t("availabilities.evenDaysSubtitle"),
        days: [...evenDays],
      })
    }

    const oddDays = ODD_CLASS_DAYS.filter((d) => activeDays.includes(d))
    if (oddDays.length > 0) {
      list.push({
        id: "odd",
        title: t("availabilities.oddDaysTitle"),
        subtitle: t("availabilities.oddDaysSubtitle"),
        days: [...oddDays],
      })
    }

    if (activeDays.includes("FRIDAY")) {
      list.push({
        id: "friday",
        title: t("availabilities.fridayTitle"),
        days: ["FRIDAY"],
      })
    }

    return list
  }, [activeDays, t])

  const handleToggleSlot = (trackDays: WeekDay[], slot: PhaseGeneratedSlot) => {
    const isAllSelected = trackDays.every((day) =>
      value.some(
        (s) => s.dayOfWeek === day && isAvailabilityCoveringSlot(s, slot)
      )
    )

    if (isAllSelected) {
      let updated = [...value]
      for (const day of trackDays) {
        const dayItems = updated.filter((item) => item.dayOfWeek === day)
        const otherItems = updated.filter((item) => item.dayOfWeek !== day)
        const newDayItems: TeacherAvailabilityInput[] = []
        for (const item of dayItems) {
          const subtracted = subtractSlotFromAvailability(item, slot)
          newDayItems.push(...subtracted)
        }
        updated = [...otherItems, ...newDayItems]
      }
      onChange(updated)
    } else {
      const additions: TeacherAvailabilityInput[] = trackDays
        .filter(
          (day) =>
            !value.some(
              (item) =>
                item.dayOfWeek === day && isAvailabilityCoveringSlot(item, slot)
            )
        )
        .map((day) => ({
          ...(currentTerm?.id ? { termId: currentTerm.id } : {}),
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }))
      onChange([...value, ...additions])
    }
  }

  const handleSelectAllTrack = (
    trackDays: WeekDay[],
    slots: PhaseGeneratedSlot[]
  ) => {
    const otherDaysSlots = value.filter(
      (s) => !trackDays.includes(s.dayOfWeek as WeekDay)
    )
    const newTrackSlots: TeacherAvailabilityInput[] = []
    for (const day of trackDays) {
      for (const slot of slots) {
        newTrackSlots.push({
          ...(currentTerm?.id ? { termId: currentTerm.id } : {}),
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      }
    }
    onChange([...otherDaysSlots, ...newTrackSlots])
  }

  const handleClearTrack = (trackDays: WeekDay[]) => {
    onChange(value.filter((s) => !trackDays.includes(s.dayOfWeek as WeekDay)))
  }

  return (
    <div className="flex flex-col gap-4">
      {isTermsLoading ? (
        <div className="flex items-center justify-center py-4">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      ) : activeTerms.length > 0 ? (
        <TermCarousel
          terms={activeTerms}
          selectedTermId={currentTerm?.id ?? ""}
          onSelectTerm={handleSelectTerm}
          value={value}
          disabled={disabled}
        />
      ) : null}

      {currentPhase && standardSlots.length > 0 ? (
        <div className="flex flex-col gap-4">
          {tracks.map((track) => (
            <TrackSlotRow
              key={track.id}
              trackTitle={track.title}
              trackSubtitle={track.subtitle}
              days={track.days}
              slots={standardSlots}
              breakInfo={phaseCalculation?.breakInfo}
              value={value}
              onToggleSlot={handleToggleSlot}
              onSelectAllTrack={handleSelectAllTrack}
              onClearTrack={handleClearTrack}
              disabled={disabled}
            />
          ))}
        </div>
      ) : !isTermsLoading ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-background/50 p-6 text-center text-xs text-muted-foreground">
          {t("availabilities.noActivePhase")}
        </div>
      ) : null}
    </div>
  )
}
