"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type { UseFormSetValue } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import type { CompensatorySession, TermDto } from "@workspace/types"
import {
  institutesResource,
  operatingPhasesResource,
  termsResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import type { CreateTermInput } from "../../../hooks/use-term-schemas"
import { buildTermProposals } from "../helper/build-term-proposals"

interface Options {
  open: boolean
  allTerms?: TermDto[]
  title: string
  startDate?: string
  endDate?: string
  phaseId?: string | null
  setValue: UseFormSetValue<CreateTermInput>
}

const EMPTY_HOLIDAYS: string[] = []

export function useCreateTermCalendar(options: Options) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const [dismissedOverride, setDismissedOverride] = React.useState<
    string[] | null
  >(null)
  const [customOffDaysOverride, setCustomOffDaysOverride] = React.useState<
    string[] | null
  >(null)
  const [compensatorySessions, setCompensatorySessions] = React.useState<
    Record<number, CompensatorySession[]>
  >({})
  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && options.open),
  })
  const { data: rawCustomOffDays } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && options.open),
  })
  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: Boolean(activeInstituteId && options.open),
  })
  const { data: phaseTerms = [] } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId,
      operatingPhaseId: options.phaseId || undefined,
    }),
    enabled: Boolean(activeInstituteId && options.phaseId && options.open),
  })
  const dismissedHolidays =
    dismissedOverride ?? institute?.dismissedHolidays ?? EMPTY_HOLIDAYS
  const customOffDays = React.useMemo(
    () =>
      customOffDaysOverride ?? rawCustomOffDays?.map((day) => day.date) ?? [],
    [customOffDaysOverride, rawCustomOffDays]
  )
  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true
  const createCustomOffDay = useMutation({
    ...institutesResource.createCustomOffDay.toMutation(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      }),
  })
  const deleteCustomOffDay = useMutation({
    ...institutesResource.deleteCustomOffDay.toMutation(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      }),
  })
  const proposals = React.useMemo(
    () =>
      buildTermProposals({
        title: options.title,
        titlePlaceholder: t("createModal.titlePlaceholder"),
        startDate: options.startDate,
        endDate: options.endDate,
        phaseId: options.phaseId,
        phases,
        phaseTerms,
        allTerms: options.allTerms,
        observeOfficialHolidays,
        customOffDays,
        dismissedHolidays,
        compensatorySessions,
      }),
    [
      options,
      phases,
      phaseTerms,
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays,
      compensatorySessions,
      t,
    ]
  )
  const lockedTermIndex = React.useMemo(() => {
    const draftTitle = options.title || t("createModal.titlePlaceholder")
    const index = proposals.findIndex(
      (proposal) =>
        proposal.title === draftTitle ||
        proposal.startDate === options.startDate
    )
    return index === -1 ? 0 : index
  }, [options.startDate, options.title, proposals, t])
  const handleStartDateChange = (_index: number, date: string) => {
    if (options.startDate && options.endDate) {
      const duration = Math.max(
        0,
        new Date(`${options.endDate}T00:00:00`).getTime() -
          new Date(`${options.startDate}T00:00:00`).getTime()
      )
      const nextEnd = new Date(
        new Date(`${date}T00:00:00`).getTime() + duration
      )
      options.setValue("endDate", nextEnd.toISOString().split("T")[0]!, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
    options.setValue("startDate", date, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }
  const handleToggleHoliday = (date: string) => {
    setDismissedOverride(
      dismissedHolidays.includes(date)
        ? dismissedHolidays.filter((value) => value !== date)
        : [...dismissedHolidays, date]
    )
    toast.success(t("batchModal.holidayToggled"))
  }
  const handleToggleCustomOffDay = (date: string) => {
    const isOff = customOffDays.includes(date)
    setCustomOffDaysOverride(
      isOff
        ? customOffDays.filter((value) => value !== date)
        : [...customOffDays, date]
    )
    if (!activeInstituteId) return
    const existing = rawCustomOffDays?.find((day) => day.date === date)
    if (isOff && existing) {
      deleteCustomOffDay.mutate({
        id: activeInstituteId,
        offDayId: existing.id,
      })
      toast.success(t("batchModal.customOffDayRemoved"))
    } else if (!isOff) {
      createCustomOffDay.mutate({
        id: activeInstituteId,
        body: { date, title: t("batchModal.defaultCustomOffDayTitle") },
      })
      toast.success(t("batchModal.customOffDayAdded"))
    }
  }
  const addCompensatorySession = (
    index: number,
    session: CompensatorySession
  ) => {
    setCompensatorySessions((current) => {
      const existing = current[index] ?? []
      if (
        existing.some(
          (value) =>
            value.date === session.date &&
            value.patternTrack === session.patternTrack
        )
      )
        return current
      return { ...current, [index]: [...existing, session] }
    })
    toast.success(t("batchModal.compensatorySessionAdded"))
  }
  const removeCompensatorySession = (index: number, date: string) => {
    setCompensatorySessions((current) => ({
      ...current,
      [index]: (current[index] ?? []).filter(
        (session) => session.date !== date
      ),
    }))
    toast.success(t("batchModal.compensatorySessionRemoved"))
  }
  const reset = () => {
    setCompensatorySessions({})
    setCustomOffDaysOverride(null)
    setDismissedOverride(null)
  }

  return {
    proposals,
    lockedTermIndex,
    observeOfficialHolidays,
    customOffDays,
    dismissedHolidays,
    compensatorySessions,
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
    addCompensatorySession,
    removeCompensatorySession,
    reset,
  }
}
