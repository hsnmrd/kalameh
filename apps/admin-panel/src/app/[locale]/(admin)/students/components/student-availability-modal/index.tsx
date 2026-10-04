"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  calculatePhaseSlots,
  EVEN_CLASS_DAYS,
  isOperatingPhaseCurrent,
  ODD_CLASS_DAYS,
  WEEK_DAYS,
  type PhaseGeneratedSlot,
  type StudentAvailabilitySlotInput,
  type StudentDto,
  type WeekDay,
} from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { operatingPhasesResource, studentsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { PhaseSelector } from "./phase-selector"
import { TrackSlotRow } from "./track-slot-row"

export interface StudentAvailabilityModalProps {
  student: StudentDto | null
  open: boolean
  onClose: () => void
  instituteId?: string
}

interface DayTrack {
  id: string
  title: string
  days: WeekDay[]
}

export function StudentAvailabilityModal({
  student,
  open,
  onClose,
  instituteId,
}: StudentAvailabilityModalProps) {
  const t = useTranslations("students")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const effectiveInstituteId =
    student?.instituteId || instituteId || activeInstituteId

  const { data: phases = [], isLoading: isPhasesLoading } = useQuery({
    ...operatingPhasesResource.list.toQuery(
      effectiveInstituteId ? { instituteId: effectiveInstituteId } : undefined
    ),
    enabled: open && Boolean(effectiveInstituteId),
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

  const { data: serverSlots = [], isLoading: isSlotsLoading } = useQuery({
    ...studentsResource.getAvailabilities.toQuery({
      id: student?.id || "",
      operatingPhaseId: currentPhase?.id,
    }),
    enabled: open && Boolean(student?.id) && Boolean(currentPhase?.id),
  })

  const [draftSlotsByPhase, setDraftSlotsByPhase] = React.useState<
    Record<string, StudentAvailabilitySlotInput[]>
  >({})

  const activeSlots = React.useMemo<StudentAvailabilitySlotInput[]>(() => {
    if (!currentPhase) return []
    const draft = draftSlotsByPhase[currentPhase.id]
    if (draft !== undefined) return draft
    return serverSlots.map((s) => ({
      dayOfWeek: s.dayOfWeek as WeekDay,
      startTime: s.startTime,
      endTime: s.endTime,
    }))
  }, [currentPhase, draftSlotsByPhase, serverSlots])

  const handleClose = React.useCallback(() => {
    setDraftSlotsByPhase({})
    setSelectedPhaseId(null)
    onClose()
  }, [onClose])

  const updateMutation = useMutation({
    ...studentsResource.updateAvailabilities.toMutation(),
    onSuccess: () => {
      toast.success(t("availabilityModal.saveSuccess"))
      queryClient.invalidateQueries({
        queryKey: studentsResource.list.baseKey(),
      })
      if (student?.id) {
        queryClient.invalidateQueries({
          queryKey: studentsResource.detail.key(student.id),
        })
        queryClient.invalidateQueries({
          queryKey: studentsResource.getAvailabilities.baseKey(),
        })
      }
      handleClose()
    },
    onError: () => {
      toast.error(t("availabilityModal.saveError"))
    },
  })

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

  const tracks = React.useMemo<DayTrack[]>(() => {
    const list: DayTrack[] = []

    const evenDays = EVEN_CLASS_DAYS.filter((d) => activeDays.includes(d))
    if (evenDays.length > 0) {
      list.push({
        id: "even",
        title: t("availabilityModal.evenDaysTitle"),
        days: [...evenDays],
      })
    }

    const oddDays = ODD_CLASS_DAYS.filter((d) => activeDays.includes(d))
    if (oddDays.length > 0) {
      list.push({
        id: "odd",
        title: t("availabilityModal.oddDaysTitle"),
        days: [...oddDays],
      })
    }

    if (activeDays.includes("FRIDAY")) {
      list.push({
        id: "friday",
        title: t("availabilityModal.fridayTitle"),
        days: ["FRIDAY"],
      })
    }

    return list
  }, [activeDays, t])

  const setSlotsForCurrentPhase = (
    newSlots: StudentAvailabilitySlotInput[]
  ) => {
    if (!currentPhase) return
    setDraftSlotsByPhase((prev) => ({
      ...prev,
      [currentPhase.id]: newSlots,
    }))
  }

  const handleToggleSlot = (trackDays: WeekDay[], slot: PhaseGeneratedSlot) => {
    const isAllSelected = trackDays.every((day) =>
      activeSlots.some(
        (s) =>
          s.dayOfWeek === day &&
          s.startTime === slot.startTime &&
          s.endTime === slot.endTime
      )
    )

    if (isAllSelected) {
      setSlotsForCurrentPhase(
        activeSlots.filter(
          (s) =>
            !(
              trackDays.includes(s.dayOfWeek as WeekDay) &&
              s.startTime === slot.startTime &&
              s.endTime === slot.endTime
            )
        )
      )
    } else {
      const filtered = activeSlots.filter(
        (s) =>
          !(
            trackDays.includes(s.dayOfWeek as WeekDay) &&
            s.startTime === slot.startTime &&
            s.endTime === slot.endTime
          )
      )
      const additions: StudentAvailabilitySlotInput[] = trackDays.map(
        (day) => ({
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      )
      setSlotsForCurrentPhase([...filtered, ...additions])
    }
  }

  const handleSelectAllTrack = (
    trackDays: WeekDay[],
    slots: PhaseGeneratedSlot[]
  ) => {
    const otherDaysSlots = activeSlots.filter(
      (s) => !trackDays.includes(s.dayOfWeek as WeekDay)
    )
    const newTrackSlots: StudentAvailabilitySlotInput[] = []
    for (const day of trackDays) {
      for (const slot of slots) {
        newTrackSlots.push({
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      }
    }
    setSlotsForCurrentPhase([...otherDaysSlots, ...newTrackSlots])
  }

  const handleClearTrack = (trackDays: WeekDay[]) => {
    setSlotsForCurrentPhase(
      activeSlots.filter((s) => !trackDays.includes(s.dayOfWeek as WeekDay))
    )
  }

  const handleSave = () => {
    if (!student?.id || !currentPhase?.id) return
    updateMutation.mutate({
      id: student.id,
      operatingPhaseId: currentPhase.id,
      availabilities: activeSlots,
    })
  }

  if (!student) return null

  const studentFullName = `${student.firstName} ${student.lastName}`

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <FormDialogContent className="overflow-hidden p-0 sm:max-w-2xl">
        <FormDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <FormDialogTitle>
            {t("availabilityModal.title")} - {studentFullName}
          </FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {isPhasesLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="size-6 text-foreground" />
            </div>
          ) : activePhases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-background/50 p-6 text-center text-xs text-muted-foreground">
              {t("availabilityModal.noActivePhase")}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("availabilityModal.phaseSelectLabel")}
                </span>
                <PhaseSelector
                  phases={activePhases}
                  selectedPhaseId={currentPhase?.id ?? ""}
                  onSelectPhase={(id) => setSelectedPhaseId(id)}
                  disabled={updateMutation.isPending}
                />
              </div>

              {isSlotsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner className="size-6 text-foreground" />
                </div>
              ) : currentPhase && standardSlots.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {tracks.map((track) => (
                    <TrackSlotRow
                      key={track.id}
                      trackTitle={track.title}
                      days={track.days}
                      slots={standardSlots}
                      value={activeSlots}
                      onToggleSlot={handleToggleSlot}
                      onSelectAllTrack={handleSelectAllTrack}
                      onClearTrack={handleClearTrack}
                      disabled={updateMutation.isPending}
                    />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>

        <FormDialogFooter className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateMutation.isPending}
          >
            {t("availabilityModal.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={
              updateMutation.isPending ||
              isPhasesLoading ||
              activePhases.length === 0 ||
              !currentPhase
            }
          >
            {updateMutation.isPending && (
              <Spinner className="me-2 size-4 text-primary-foreground" />
            )}
            {t("availabilityModal.save")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
