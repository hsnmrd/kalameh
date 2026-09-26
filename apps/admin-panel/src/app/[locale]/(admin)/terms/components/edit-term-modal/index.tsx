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

const EMPTY_TERM_VALUES: UpdateTermInput = {
  title: "",
  startDate: "",
  endDate: "",
  isActive: true,
  operatingPhaseId: undefined,
}
const EMPTY_DISMISSED_HOLIDAYS: string[] = []

function formatDateForInput(dateVal: string | Date | undefined) {
  if (!dateVal) return ""
  const date = new Date(dateVal)
  return date.toISOString().split("T")[0] || ""
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

  const formValues = React.useMemo<UpdateTermInput>(
    () =>
      term
        ? {
            title: term.title,
            startDate: formatDateForInput(term.startDate),
            endDate: formatDateForInput(term.endDate),
            isActive: term.isActive,
            operatingPhaseId: term.operatingPhaseId || undefined,
          }
        : EMPTY_TERM_VALUES,
    [term]
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateTermInput>({
    resolver: zodResolver(updateTermSchema),
    defaultValues: EMPTY_TERM_VALUES,
    values: formValues,
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
  const [dismissedHolidaysOverride, setDismissedHolidaysOverride] =
    React.useState<string[] | null>(null)
  const [localCustomOffDays, setLocalCustomOffDays] = React.useState<
    string[] | null
  >(null)
  const [compensatorySessions, setCompensatorySessions] = React.useState<
    Record<number, CompensatorySession[]>
  >({})
  const [proposalDraft, setProposalDraft] = React.useState<{
    key: string
    proposals: GeneratedTermProposal[]
  } | null>(null)

  const customOffDays = React.useMemo(() => {
    if (localCustomOffDays !== null) return localCustomOffDays
    return rawCustomOffDays?.map((d) => d.date) ?? []
  }, [localCustomOffDays, rawCustomOffDays])
  const activeDismissedHolidays =
    dismissedHolidaysOverride ??
    institute?.dismissedHolidays ??
    EMPTY_DISMISSED_HOLIDAYS
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
  }, [phases, targetPhaseId, term])

  const buildInitialProposals = React.useCallback(
    (
      currentTerm: TermDto,
      overrideDismissed: string[],
      overrideCompensatory: Record<number, CompensatorySession[]>
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
    ]
  )

  const proposalSourceKey = React.useMemo(
    () =>
      [
        term?.id ?? "",
        targetPhaseId ?? "",
        ...phaseTerms.map(
          (phaseTerm) =>
            `${phaseTerm.id}:${phaseTerm.title}:${phaseTerm.startDate}:${phaseTerm.endDate}`
        ),
      ].join("|"),
    [phaseTerms, targetPhaseId, term?.id]
  )

  const initialProposals = React.useMemo(
    () =>
      term ? buildInitialProposals(term, activeDismissedHolidays, {}) : [],
    [term, buildInitialProposals, activeDismissedHolidays]
  )

  const proposalValues =
    proposalDraft?.key === proposalSourceKey
      ? proposalDraft.proposals
      : initialProposals

  const lockedTermIndex = React.useMemo(() => {
    if (proposalValues.length <= 1) return 0
    const found = proposalValues.findIndex(
      (p) =>
        (p.title === term?.title && p.startDate === originalStartDate) ||
        p.startDate === originalStartDate
    )
    return found !== -1 ? found : 0
  }, [proposalValues, term?.title, originalStartDate])

  const proposals = React.useMemo(
    () =>
      proposalValues.map((proposal, index) =>
        index === lockedTermIndex
          ? { ...proposal, title: watchedTitle || term?.title || "" }
          : proposal
      ),
    [proposalValues, lockedTermIndex, watchedTitle, term?.title]
  )

  const setProposals = React.useCallback(
    (nextProposals: GeneratedTermProposal[]) => {
      setProposalDraft({ key: proposalSourceKey, proposals: nextProposals })
    },
    [proposalSourceKey]
  )

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

  /**
   * Merges a recalculated proposals array with the pre-recalculation snapshot,
   * restoring every sibling (non-locked) term to its original data.
   * Only the locked term's entry is taken from the recalculated result,
   * ensuring sibling terms shown as context are never mutated by edits to
   * the term currently being edited.
   */
  const mergeWithFrozenSiblings = React.useCallback(
    (
      recalculated: GeneratedTermProposal[],
      snapshot: GeneratedTermProposal[]
    ): GeneratedTermProposal[] =>
      recalculated.map((entry, idx) =>
        idx === lockedTermIndex ? entry : (snapshot[idx] ?? entry)
      ),
    [lockedTermIndex]
  )

  /**
   * Validates that the recalculated term's end date does not collide with or
   * exceed the next sibling term's start date (forward constraint).
   * Since sibling terms are frozen, the current term must have enough calendar
   * days to finish all required sessions before the next term starts.
   */
  const validateNextSiblingBoundary = React.useCallback(
    (
      recalculatedActive: GeneratedTermProposal | undefined,
      snapshot: GeneratedTermProposal[]
    ) => {
      if (!recalculatedActive) return
      const nextSibling = snapshot[lockedTermIndex + 1]
      if (nextSibling && nextSibling.startDate) {
        const activeEnd = new Date(recalculatedActive.endDate + "T12:00:00")
        const nextStart = new Date(nextSibling.startDate + "T12:00:00")
        if (activeEnd >= nextStart) {
          throw new Error(
            t("editModal.overlapNextTermError", {
              title: nextSibling.title,
            })
          )
        }
      }
    },
    [lockedTermIndex, t]
  )

  const handleStartDateChange = (index: number, newStartDate: string) => {
    // Only the locked term's start date may be changed in the edit modal.
    // Clicks on sibling term start-date tiles must be silently ignored.
    if (index !== lockedTermIndex) return

    try {
      const snapshot = proposals
      const { daysOfWeek, classPatterns } = getPhaseContext()
      const targetSessions = standardSessionsCount

      const userCustomTitles: Record<number, string> = {}
      proposals.forEach((p, i) => {
        userCustomTitles[i] =
          i === lockedTermIndex
            ? watchedTitle || term?.title || p.title
            : p.title
      })

      const recalculated = recalculatePhaseTerms({
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

      validateNextSiblingBoundary(recalculated[lockedTermIndex], snapshot)

      const updated = mergeWithFrozenSiblings(recalculated, snapshot)
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

      if (proposals.length > 0) {
        const snapshot = proposals
        const { daysOfWeek, classPatterns } = getPhaseContext()
        const targetSessions = standardSessionsCount

        const userCustomTitles: Record<number, string> = {}
        proposals.forEach((p, i) => {
          userCustomTitles[i] =
            i === lockedTermIndex
              ? watchedTitle || term?.title || p.title
              : p.title
        })

        const recalculated = recalculatePhaseTerms({
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

        validateNextSiblingBoundary(recalculated[lockedTermIndex], snapshot)

        setDismissedHolidaysOverride(nextDismissed)
        const updated = mergeWithFrozenSiblings(recalculated, snapshot)
        setProposals(updated)

        const activeUpdated = updated[lockedTermIndex]
        if (activeUpdated) {
          setValue("endDate", activeUpdated.endDate, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      } else {
        setDismissedHolidaysOverride(nextDismissed)
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

    if (proposals.length > 0) {
      try {
        const snapshot = proposals
        const { daysOfWeek, classPatterns } = getPhaseContext()
        const targetSessions = proposals[lockedTermIndex]?.sessionsCount || 18

        const recalculated = recalculatePhaseTerms({
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

        validateNextSiblingBoundary(recalculated[lockedTermIndex], snapshot)

        setLocalCustomOffDays(nextCustomOffDays)
        const updated = mergeWithFrozenSiblings(recalculated, snapshot)
        setProposals(updated)

        const activeUpdated = updated[lockedTermIndex]
        if (activeUpdated) {
          setValue("endDate", activeUpdated.endDate, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(err.message)
        }
        return
      }
    } else {
      setLocalCustomOffDays(nextCustomOffDays)
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
        const snapshot = proposals
        const { daysOfWeek, classPatterns } = getPhaseContext()
        const targetSessions = standardSessionsCount

        const userCustomTitles: Record<number, string> = {}
        proposals.forEach((p, i) => {
          userCustomTitles[i] =
            i === lockedTermIndex
              ? watchedTitle || term?.title || p.title
              : p.title
        })

        const recalculated = recalculatePhaseTerms({
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

        const updated = mergeWithFrozenSiblings(recalculated, snapshot)
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

    if (proposals.length > 0) {
      try {
        const snapshot = proposals
        const { daysOfWeek, classPatterns } = getPhaseContext()
        const targetSessions = standardSessionsCount

        const userCustomTitles: Record<number, string> = {}
        proposals.forEach((p, i) => {
          userCustomTitles[i] =
            i === lockedTermIndex
              ? watchedTitle || term?.title || p.title
              : p.title
        })

        const recalculated = recalculatePhaseTerms({
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

        validateNextSiblingBoundary(recalculated[lockedTermIndex], snapshot)

        setCompensatorySessions(nextCompensatory)
        const updated = mergeWithFrozenSiblings(recalculated, snapshot)
        setProposals(updated)

        const activeUpdated = updated[lockedTermIndex]
        if (activeUpdated) {
          setValue("endDate", activeUpdated.endDate, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
        toast.success(t("batchModal.compensatorySessionRemoved"))
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(err.message)
        }
      }
    } else {
      setCompensatorySessions(nextCompensatory)
      toast.success(t("batchModal.compensatorySessionRemoved"))
    }
  }

  const handleClose = React.useCallback(() => {
    reset(formValues)
    setDismissedHolidaysOverride(null)
    setLocalCustomOffDays(null)
    setCompensatorySessions({})
    setProposalDraft(null)
    onClose()
  }, [formValues, onClose, reset])

  const updateMutation = useMutation({
    ...termsResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      handleClose()
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
      handleClose()
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

            {proposals[lockedTermIndex]?.hasSessionImbalance && (
              <div className="flex animate-in items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive fade-in-50">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-destructive">
                    {t("batchModal.sessionImbalanceWarning")}:{" "}
                    {proposals[lockedTermIndex]?.title}
                  </span>
                  <span className="leading-relaxed text-muted-foreground">
                    {(() => {
                      const active = proposals[lockedTermIndex]
                      const even =
                        active?.patternDetails?.find((d) => d.track === "EVEN")
                          ?.completedSessions ?? 0
                      const odd =
                        active?.patternDetails?.find((d) => d.track === "ODD")
                          ?.completedSessions ?? 0
                      return t("batchModal.sessionImbalanceDesc", {
                        even: formatNumber(even, locale || "fa"),
                        odd: formatNumber(odd, locale || "fa"),
                        target: formatNumber(
                          active?.sessionsCount ?? 18,
                          locale || "fa"
                        ),
                      })
                    })()}
                  </span>
                </div>
              </div>
            )}

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
              onClick={handleClose}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                updateMutation.isPending ||
                Boolean(proposals[lockedTermIndex]?.hasSessionImbalance)
              }
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
