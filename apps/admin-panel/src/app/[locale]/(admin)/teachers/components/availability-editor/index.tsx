"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  calculatePhaseSlots,
  EVEN_CLASS_DAYS,
  isOperatingPhaseCurrent,
  ODD_CLASS_DAYS,
  WEEK_DAYS,
  type PhaseGeneratedSlot,
  type TeacherAvailabilityInput,
  type WeekDay,
} from "@workspace/types"
import { Spinner } from "@workspace/ui/components/spinner"
import { operatingPhasesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { PhaseCarousel } from "./phase-carousel"
import { TrackSlotRow } from "./track-slot-row"

export interface AvailabilityEditorProps {
  value: TeacherAvailabilityInput[]
  onChange: (slots: TeacherAvailabilityInput[]) => void
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
  instituteId,
  disabled = false,
}: AvailabilityEditorProps) {
  const t = useTranslations("teachers")
  const { activeInstituteId } = useActiveInstitute()
  const effectiveInstituteId = instituteId || activeInstituteId

  const { data: phases = [], isLoading: isPhasesLoading } = useQuery({
    ...operatingPhasesResource.list.toQuery(
      effectiveInstituteId ? { instituteId: effectiveInstituteId } : undefined
    ),
    enabled: Boolean(effectiveInstituteId),
  })

  const activePhases = React.useMemo(
    () => phases.filter((p) => p.isActive),
    [phases]
  )

  const defaultPhase = React.useMemo(() => {
    return (
      activePhases.find((p) => isOperatingPhaseCurrent(p)) ||
      activePhases[0] ||
      null
    )
  }, [activePhases])

  const [selectedPhaseId, setSelectedPhaseId] = React.useState<string | null>(
    null
  )
  const currentPhase = React.useMemo(() => {
    const id = selectedPhaseId || defaultPhase?.id
    return activePhases.find((p) => p.id === id) || null
  }, [selectedPhaseId, defaultPhase, activePhases])

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
      return WEEK_DAYS.filter((d) => currentPhase.daysOfWeek.includes(d))
    }
    return WEEK_DAYS as unknown as WeekDay[]
  }, [currentPhase])

  // Split active days into Even, Odd, and weekend tracks
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
        (s) =>
          s.dayOfWeek === day &&
          s.startTime === slot.startTime &&
          s.endTime === slot.endTime
      )
    )

    if (isAllSelected) {
      // Remove this slot from all track days
      onChange(
        value.filter(
          (s) =>
            !(
              trackDays.includes(s.dayOfWeek as WeekDay) &&
              s.startTime === slot.startTime &&
              s.endTime === slot.endTime
            )
        )
      )
    } else {
      // Add this slot to all track days that don't already have it
      const filtered = value.filter(
        (s) =>
          !(
            trackDays.includes(s.dayOfWeek as WeekDay) &&
            s.startTime === slot.startTime &&
            s.endTime === slot.endTime
          )
      )
      const additions: TeacherAvailabilityInput[] = trackDays.map((day) => ({
        dayOfWeek: day,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))
      onChange([...filtered, ...additions])
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
      {/* Operating Phases Carousel */}
      {isPhasesLoading ? (
        <div className="flex items-center justify-center py-4">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      ) : activePhases.length > 0 ? (
        <PhaseCarousel
          phases={activePhases}
          selectedPhaseId={currentPhase?.id ?? ""}
          onSelectPhase={(id) => setSelectedPhaseId(id)}
          value={value}
          disabled={disabled}
        />
      ) : null}

      {/* Standard Operating Phase Slots in Even / Odd tracks */}
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
      ) : !isPhasesLoading ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-background/50 p-6 text-center text-xs text-muted-foreground">
          {t("availabilities.noActivePhase")}
        </div>
      ) : null}
    </div>
  )
}
