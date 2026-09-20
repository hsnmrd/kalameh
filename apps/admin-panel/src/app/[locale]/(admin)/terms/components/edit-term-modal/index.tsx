"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import {
  type TermDto,
  type SupportedLocale,
  type GeneratedTermProposal,
  type CompensatorySession,
  type WeekDay,
  convertTermDtoToProposal,
  recalculatePhaseTerms,
  resolveClassPatterns,
} from "@workspace/types"
import {
  termsResource,
  institutesResource,
  operatingPhasesResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useUpdateTermSchema,
  type UpdateTermInput,
} from "../../hooks/use-term-schemas"
import { ProposalsCalendar } from "../generate-phase-terms-modal/proposals-calendar"

export interface EditTermModalProps {
  term: TermDto | null
  open: boolean
  onClose: () => void
  allTerms?: TermDto[]
}

export function EditTermModal({
  term,
  open,
  onClose,
  allTerms,
}: EditTermModalProps) {
  const t = useTranslations("terms")
  const locale = useLocale() as SupportedLocale
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const updateTermSchema = useUpdateTermSchema()

  const statusOptions: ComboboxOption[] = React.useMemo(
    () => [
      { value: "true", label: t("editModal.statusActive") },
      { value: "false", label: t("editModal.statusInactive") },
    ],
    [t]
  )

  const formatDateForInput = (dateVal: string | Date | undefined) => {
    if (!dateVal) return ""
    const d = new Date(dateVal)
    return d.toISOString().split("T")[0] || ""
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateTermInput>({
    resolver: zodResolver(updateTermSchema),
    defaultValues: {
      title: "",
      startDate: "",
      endDate: "",
      isActive: true,
      operatingPhaseId: undefined,
    },
  })

  const classesCount = term?.classesCount ?? 0
  const hasClasses = classesCount > 0

  const originalStartDate = React.useMemo(
    () => formatDateForInput(term?.startDate),
    [term?.startDate]
  )
  const originalEndDate = React.useMemo(
    () => formatDateForInput(term?.endDate),
    [term?.endDate]
  )

  const watchedTitle = useWatch({ control, name: "title" })
  const watchedStartDate = useWatch({ control, name: "startDate" })
  const watchedEndDate = useWatch({ control, name: "endDate" })
  const watchedPhaseId = useWatch({ control, name: "operatingPhaseId" })

  const isDateChanged = Boolean(
    hasClasses &&
    ((watchedStartDate && watchedStartDate !== originalStartDate) ||
      (watchedEndDate && watchedEndDate !== originalEndDate))
  )

  // Fetch institute details for holiday observance preference
  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })

  // Fetch custom institute off-days
  const { data: rawCustomOffDays } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })

  // Fetch operating phases for day-of-week metadata
  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && open),
  })

  // Fetch sibling terms of the term's operating phase
  const targetPhaseId = term?.operatingPhaseId || watchedPhaseId
  const { data: phaseTerms = [] } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId,
      operatingPhaseId: targetPhaseId || undefined,
    }),
    enabled: Boolean(activeInstituteId && targetPhaseId && open),
  })

  // Calendar off-days & compensatory state
  const [activeDismissedHolidays, setActiveDismissedHolidays] = React.useState<
    string[]
  >([])
  const [localCustomOffDays, setLocalCustomOffDays] = React.useState<
    string[] | null
  >(null)
  const [compensatorySessions, setCompensatorySessions] = React.useState<
    Record<number, CompensatorySession[]>
  >({})
  const [proposals, setProposals] = React.useState<GeneratedTermProposal[]>([])

  React.useEffect(() => {
    if (institute?.dismissedHolidays) {
      setActiveDismissedHolidays(institute.dismissedHolidays)
    }
  }, [institute?.dismissedHolidays])

  const customOffDays = React.useMemo(() => {
    if (localCustomOffDays !== null) return localCustomOffDays
    return rawCustomOffDays?.map((d) => d.date) ?? []
  }, [localCustomOffDays, rawCustomOffDays])
  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true

  const createCustomOffDayMutation = useMutation({
    ...institutesResource.createCustomOffDay.toMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      })
    },
  })

  const deleteCustomOffDayMutation = useMutation({
    ...institutesResource.deleteCustomOffDay.toMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      })
    },
  })

  const getPhaseContext = React.useCallback(() => {
    const currentPhase = phases.find((p) => p.id === targetPhaseId)
    const phaseDays =
      currentPhase?.daysOfWeek && currentPhase.daysOfWeek.length > 0
        ? currentPhase.daysOfWeek
        : term?.operatingPhase?.daysOfWeek &&
            term.operatingPhase.daysOfWeek.length > 0
          ? term.operatingPhase.daysOfWeek
          : ["SATURDAY", "MONDAY", "WEDNESDAY"]
    const daysOfWeek = phaseDays as WeekDay[]
    const classPatterns = resolveClassPatterns(daysOfWeek)
    return { currentPhase, daysOfWeek, classPatterns }
  }, [phases, targetPhaseId, term?.operatingPhase])

  const buildInitialProposals = React.useCallback(
    (
      currentTerm: TermDto,
      overrideDismissed = activeDismissedHolidays,
      overrideCompensatory = compensatorySessions
    ) => {
      const { daysOfWeek, classPatterns } = getPhaseContext()
      const currentPhase = phases.find(
        (p) => p.id === (currentTerm.operatingPhaseId || undefined)
      )
      const activeTermData = {
        id: currentTerm.id,
        title: currentTerm.title,
        startDate: formatDateForInput(currentTerm.startDate),
        endDate: formatDateForInput(currentTerm.endDate),
        operatingPhaseId: currentTerm.operatingPhaseId || undefined,
        operatingPhase: currentPhase
          ? { months: currentPhase.months, daysOfWeek: currentPhase.daysOfWeek }
          : currentTerm.operatingPhase,
      }

      if (!currentTerm.operatingPhaseId) {
        return [
          convertTermDtoToProposal(activeTermData, {
            daysOfWeek,
            classPatterns,
            observeOfficialHolidays,
            customOffDays,
            dismissedHolidays: overrideDismissed,
            compensatorySessions: overrideCompensatory[0] ?? [],
          }),
        ]
      }

      const rawSiblings = (
        phaseTerms && phaseTerms.length > 0
          ? phaseTerms
          : (allTerms?.filter(
              (t) => t.operatingPhaseId === currentTerm.operatingPhaseId
            ) ?? [])
      ).filter((t) => t.id !== currentTerm.id)

      const allCombined = [...rawSiblings, activeTermData].sort((a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0
        return aDate - bDate
      })

      return allCombined.map((t, idx) => {
        const isCurrentTerm = t.id === currentTerm.id
        return convertTermDtoToProposal(t, {
          daysOfWeek,
          classPatterns,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays: isCurrentTerm ? overrideDismissed : undefined,
          compensatorySessions: isCurrentTerm
            ? (overrideCompensatory[idx] ?? [])
            : undefined,
        })
      })
    },
    [
      getPhaseContext,
      phases,
      phaseTerms,
      allTerms,
      observeOfficialHolidays,
      customOffDays,
      activeDismissedHolidays,
      compensatorySessions,
    ]
  )

  const lastInitializedIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      lastInitializedIdRef.current = null
      return
    }
    if (term && open && lastInitializedIdRef.current !== term.id) {
      lastInitializedIdRef.current = term.id
      reset({
        title: term.title,
        startDate: formatDateForInput(term.startDate),
        endDate: formatDateForInput(term.endDate),
        isActive: term.isActive,
        operatingPhaseId: term.operatingPhaseId || undefined,
      })
      setCompensatorySessions({})
      setLocalCustomOffDays(null)
      const initial = buildInitialProposals(term)
      setProposals(initial)
    }
  }, [term, open, reset, buildInitialProposals])

  React.useEffect(() => {
    if (
      open &&
      term?.operatingPhaseId &&
      phaseTerms.length > 0 &&
      proposals.length <= 1
    ) {
      const updated = buildInitialProposals(term)
      setProposals(updated)
    }
  }, [open, term, phaseTerms.length, proposals.length, buildInitialProposals])

  const lockedTermIndex = React.useMemo(() => {
    if (proposals.length <= 1) return 0
    const found = proposals.findIndex(
      (p) =>
        (term?.id && p.title === (watchedTitle || term?.title)) ||
        p.startDate === watchedStartDate
    )
    return found !== -1 ? found : 0
  }, [proposals, watchedTitle, term?.title, term?.id, watchedStartDate])

  React.useEffect(() => {
    if (proposals.length > 0 && watchedTitle !== undefined) {
      setProposals((prev) =>
        prev.map((p, idx) =>
          idx === lockedTermIndex
            ? { ...p, title: watchedTitle || term?.title || "" }
            : p
        )
      )
    }
  }, [watchedTitle, lockedTermIndex, term?.title])

  const standardSessionsCount = React.useMemo(() => {
    // 1. If we have sibling terms in proposals, find the standard (mode/majority) sessionsCount
    const siblingCounts = proposals
      .filter((_, idx) => idx !== lockedTermIndex)
      .map((p) => p.sessionsCount)
      .filter((c): c is number => Boolean(c && c > 0))

    if (siblingCounts.length > 0) {
      const freq: Record<number, number> = {}
      for (const c of siblingCounts) {
        freq[c] = (freq[c] || 0) + 1
      }
      let modeCount = siblingCounts[0]!
      let maxFreq = 0
      for (const [countStr, f] of Object.entries(freq)) {
        if (f > maxFreq) {
          maxFreq = f
          modeCount = Number(countStr)
        }
      }
      return modeCount
    }

    // 2. Fallback to current proposal's sessionsCount or 18
    return proposals[lockedTermIndex]?.sessionsCount || 18
  }, [proposals, lockedTermIndex])

  const handleStartDateChange = (index: number, newStartDate: string) => {
    try {
      const { daysOfWeek, classPatterns } = getPhaseContext()
      const targetSessions = standardSessionsCount

      const userCustomTitles: Record<number, string> = {}
      proposals.forEach((p, i) => {
        userCustomTitles[i] =
          i === lockedTermIndex
            ? watchedTitle || term?.title || p.title
            : p.title
      })

      const updated = recalculatePhaseTerms({
        proposals,
        changedIndex: index,
        newStartDate,
        sessionsPerTerm: targetSessions,
        daysPerTerm: targetSessions,
        daysOfWeek,
        classPatterns,
        gapDaysBetweenTerms: 2,
        userCustomTitles,
        observeOfficialHolidays,
        customOffDays,
        dismissedHolidays: activeDismissedHolidays,
        compensatorySessions,
      })

      setProposals(updated)

      const activeUpdated = updated[lockedTermIndex]
      if (activeUpdated) {
        setValue("startDate", activeUpdated.startDate, {
          shouldValidate: true,
          shouldDirty: true,
        })
        setValue("endDate", activeUpdated.endDate, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      } else {
        toast.error(t("batchModal.recalculateError"))
      }
    }
  }

  const handleToggleHoliday = (dateYmd: string) => {
    try {
      const isCurrentlyDismissed = activeDismissedHolidays.includes(dateYmd)
      const nextDismissed = isCurrentlyDismissed
        ? activeDismissedHolidays.filter((d) => d !== dateYmd)
        : [...activeDismissedHolidays, dateYmd]

      setActiveDismissedHolidays(nextDismissed)

      if (proposals.length > 0) {
        const { daysOfWeek, classPatterns } = getPhaseContext()
        const targetSessions = standardSessionsCount

        const userCustomTitles: Record<number, string> = {}
        proposals.forEach((p, i) => {
          userCustomTitles[i] =
            i === lockedTermIndex
              ? watchedTitle || term?.title || p.title
              : p.title
        })

        const updated = recalculatePhaseTerms({
          proposals,
          changedIndex: lockedTermIndex,
          newStartDate: proposals[lockedTermIndex]!.startDate,
          sessionsPerTerm: targetSessions,
          daysPerTerm: targetSessions,
          daysOfWeek,
          classPatterns,
          gapDaysBetweenTerms: 2,
          userCustomTitles,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays: nextDismissed,
          compensatorySessions,
        })

        setProposals(updated)

        const activeUpdated = updated[lockedTermIndex]
        if (activeUpdated) {
          setValue("endDate", activeUpdated.endDate, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      }
      toast.success(t("batchModal.holidayToggled"))
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
    }
  }

  const handleToggleCustomOffDay = (dateYmd: string) => {
    const isCurrentlyOff = customOffDays.includes(dateYmd)
    const nextCustomOffDays = isCurrentlyOff
      ? customOffDays.filter((d) => d !== dateYmd)
      : [...customOffDays, dateYmd]
    setLocalCustomOffDays(nextCustomOffDays)

    if (proposals.length > 0) {
      try {
        const { daysOfWeek, classPatterns } = getPhaseContext()
        const targetSessions = proposals[lockedTermIndex]?.sessionsCount || 18

        const updated = recalculatePhaseTerms({
          proposals,
          changedIndex: lockedTermIndex,
          newStartDate: proposals[lockedTermIndex]!.startDate,
          sessionsPerTerm: targetSessions,
          daysPerTerm: targetSessions,
          daysOfWeek,
          classPatterns,
          gapDaysBetweenTerms: 2,
          observeOfficialHolidays,
          customOffDays: nextCustomOffDays,
          dismissedHolidays: activeDismissedHolidays,
          compensatorySessions,
        })

        setProposals(updated)

        const activeUpdated = updated[lockedTermIndex]
        if (activeUpdated) {
          setValue("endDate", activeUpdated.endDate, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      } catch {
        // ignore
      }
    }

    if (activeInstituteId) {
      if (isCurrentlyOff) {
        const existing = rawCustomOffDays?.find((d) => d.date === dateYmd)
        if (existing) {
          deleteCustomOffDayMutation.mutate({
            id: activeInstituteId,
            offDayId: existing.id,
          })
        }
        toast.success(t("batchModal.customOffDayRemoved"))
      } else {
        createCustomOffDayMutation.mutate({
          id: activeInstituteId,
          body: {
            date: dateYmd,
            title: t("batchModal.defaultCustomOffDayTitle"),
          },
        })
        toast.success(t("batchModal.customOffDayAdded"))
      }
    }
  }

  const handleAddCompensatorySession = (
    termIndex: number,
    session: CompensatorySession
  ) => {
    const existing = compensatorySessions[termIndex] ?? []
    if (
      existing.some(
        (s) =>
          s.date === session.date && s.patternTrack === session.patternTrack
      )
    ) {
      return
    }
    const nextCompensatory = {
      ...compensatorySessions,
      [termIndex]: [...existing, session],
    }
    setCompensatorySessions(nextCompensatory)

    if (proposals.length > 0) {
      try {
        const { daysOfWeek, classPatterns } = getPhaseContext()
        const targetSessions = standardSessionsCount

        const userCustomTitles: Record<number, string> = {}
        proposals.forEach((p, i) => {
          userCustomTitles[i] =
            i === lockedTermIndex
              ? watchedTitle || term?.title || p.title
              : p.title
        })

        const updated = recalculatePhaseTerms({
          proposals,
          changedIndex: lockedTermIndex,
          newStartDate: proposals[lockedTermIndex]!.startDate,
          sessionsPerTerm: targetSessions,
          daysPerTerm: targetSessions,
          daysOfWeek,
          classPatterns,
          gapDaysBetweenTerms: 2,
          userCustomTitles,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays: activeDismissedHolidays,
          compensatorySessions: nextCompensatory,
        })

        setProposals(updated)

        const activeUpdated = updated[lockedTermIndex]
        if (activeUpdated) {
          setValue("endDate", activeUpdated.endDate, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      } catch {
        // ignore
      }
    }

    toast.success(t("batchModal.compensatorySessionAdded"))
  }

  const handleRemoveCompensatorySession = (
    termIndex: number,
    dateYmd: string
  ) => {
    const existing = compensatorySessions[termIndex] ?? []
    const nextCompensatory = {
      ...compensatorySessions,
      [termIndex]: existing.filter((s) => s.date !== dateYmd),
    }
    setCompensatorySessions(nextCompensatory)

    if (proposals.length > 0) {
      try {
        const { daysOfWeek, classPatterns } = getPhaseContext()
        const targetSessions = standardSessionsCount

        const userCustomTitles: Record<number, string> = {}
        proposals.forEach((p, i) => {
          userCustomTitles[i] =
            i === lockedTermIndex
              ? watchedTitle || term?.title || p.title
              : p.title
        })

        const updated = recalculatePhaseTerms({
          proposals,
          changedIndex: lockedTermIndex,
          newStartDate: proposals[lockedTermIndex]!.startDate,
          sessionsPerTerm: targetSessions,
          daysPerTerm: targetSessions,
          daysOfWeek,
          classPatterns,
          gapDaysBetweenTerms: 2,
          userCustomTitles,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays: activeDismissedHolidays,
          compensatorySessions: nextCompensatory,
        })

        setProposals(updated)

        const activeUpdated = updated[lockedTermIndex]
        if (activeUpdated) {
          setValue("endDate", activeUpdated.endDate, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      } catch {
        // ignore
      }
    }

    toast.success(t("batchModal.compensatorySessionRemoved"))
  }

  const updateMutation = useMutation({
    ...termsResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: UpdateTermInput) => {
    if (!term) return
    updateMutation.mutate({
      id: term.id,
      body: values,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:h-[90dvh] sm:max-w-4xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-0 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Form row: Title and Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.title)}>
                <FieldLabel>{t("editModal.termTitle")}</FieldLabel>
                <Input {...register("title")} />
                <FieldError>{errors.title?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>{t("editModal.isActive")}</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={statusOptions}
                      value={String(field.value ?? true)}
                      onValueChange={(val) => field.onChange(val === "true")}
                      placeholder={t("editModal.statusActive")}
                      drawerTitle={t("editModal.isActive")}
                      searchable={false}
                      clearable={false}
                      className="w-full"
                    />
                  )}
                />
              </Field>
            </div>

            {isDateChanged && (
              <div className="flex animate-in items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning fade-in-50">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <span>
                  {t("editModal.dateChangeWarning", {
                    count: formatNumber(classesCount, locale),
                  })}
                </span>
              </div>
            )}

            {/* Embedded Interactive Calendar Preview */}
            {proposals.length > 0 && (
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-t border-border/60 pt-4">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {targetPhaseId
                      ? t("batchModal.calendarPhaseTitle")
                      : t("batchModal.calendarSingleTitle")}
                  </h4>
                </div>

                <ProposalsCalendar
                  proposals={proposals}
                  lockedTermIndex={lockedTermIndex}
                  onStartDateChange={handleStartDateChange}
                  onToggleHoliday={handleToggleHoliday}
                  onToggleCustomOffDay={handleToggleCustomOffDay}
                  onAddCompensatorySession={handleAddCompensatorySession}
                  onRemoveCompensatorySession={handleRemoveCompensatorySession}
                  locale={locale}
                  observeOfficialHolidays={observeOfficialHolidays}
                  customOffDays={customOffDays}
                  activeDismissedHolidays={activeDismissedHolidays}
                  compensatorySessions={compensatorySessions}
                  showLegend={false}
                />
              </div>
            )}
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {t("editModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
