"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Calendar as CalendarIcon } from "lucide-react"
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
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  type SupportedLocale,
  type TermDto,
  type GeneratedTermProposal,
  type CompensatorySession,
  convertTermDtoToProposal,
} from "@workspace/types"
import {
  termsResource,
  institutesResource,
  operatingPhasesResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useCreateTermSchema,
  type CreateTermInput,
} from "../../hooks/use-term-schemas"
import { PhaseSelectField } from "../phase-select-field"
import { TermCalculatorSection } from "./term-calculator-section"
import { ProposalsCalendar } from "../generate-phase-terms-modal/proposals-calendar"

export interface CreateTermModalProps {
  open: boolean
  onClose: () => void
  allTerms?: TermDto[]
}

const DEFAULT_VALUES: CreateTermInput = {
  title: "",
  startDate: "",
  endDate: "",
  isActive: true,
  operatingPhaseId: undefined,
}
const EMPTY_DISMISSED_HOLIDAYS: string[] = []

export function CreateTermModal({
  open,
  onClose,
  allTerms,
}: CreateTermModalProps) {
  const t = useTranslations("terms")
  const locale = useLocale() as SupportedLocale
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const createTermSchema = useCreateTermSchema()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateTermInput>({
    resolver: zodResolver(createTermSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const watchedTitle = useWatch({ control, name: "title" })
  const watchedStartDate = useWatch({ control, name: "startDate" })
  const watchedEndDate = useWatch({ control, name: "endDate" })
  const watchedPhaseId = useWatch({ control, name: "operatingPhaseId" })

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

  // Fetch sibling terms of the selected phase
  const { data: phaseTerms = [] } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId,
      operatingPhaseId: watchedPhaseId || undefined,
    }),
    enabled: Boolean(activeInstituteId && watchedPhaseId && open),
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

  const activeDismissedHolidays =
    dismissedHolidaysOverride ??
    institute?.dismissedHolidays ??
    EMPTY_DISMISSED_HOLIDAYS

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

  // Build proposals for ProposalsCalendar
  const proposals: GeneratedTermProposal[] = React.useMemo(() => {
    const rawSiblings = watchedPhaseId
      ? (phaseTerms && phaseTerms.length > 0
          ? phaseTerms
          : (allTerms?.filter((t) => t.operatingPhaseId === watchedPhaseId) ??
            [])
        ).filter(Boolean)
      : []

    const currentPhase = phases.find((p) => p.id === watchedPhaseId)
    const hasValidDraftDates = Boolean(
      watchedStartDate && watchedEndDate && watchedStartDate <= watchedEndDate
    )

    if (!hasValidDraftDates) {
      // If dates not entered yet, show phase sibling terms if any
      if (rawSiblings.length > 0) {
        return rawSiblings
          .sort((a, b) => {
            const aDate = a.startDate ? new Date(a.startDate).getTime() : 0
            const bDate = b.startDate ? new Date(b.startDate).getTime() : 0
            return aDate - bDate
          })
          .map((t) =>
            convertTermDtoToProposal(t, {
              observeOfficialHolidays,
              customOffDays,
            })
          )
      }
      return []
    }

    const draftTermData = {
      id: "draft-new-term",
      title: watchedTitle || t("createModal.titlePlaceholder"),
      startDate: watchedStartDate,
      endDate: watchedEndDate,
      operatingPhaseId: watchedPhaseId || undefined,
      operatingPhase: currentPhase
        ? { months: currentPhase.months, daysOfWeek: currentPhase.daysOfWeek }
        : undefined,
    }

    if (!watchedPhaseId) {
      // Standalone new term
      const singleProposal = convertTermDtoToProposal(draftTermData, {
        observeOfficialHolidays,
        customOffDays,
        dismissedHolidays: activeDismissedHolidays,
        compensatorySessions: compensatorySessions[0] ?? [],
      })
      return [singleProposal]
    }

    // Merge siblings and draft term, sort chronologically
    const allCombined = [...rawSiblings, draftTermData].sort((a, b) => {
      const aDate = a.startDate ? new Date(a.startDate).getTime() : 0
      const bDate = b.startDate ? new Date(b.startDate).getTime() : 0
      return aDate - bDate
    })

    return allCombined.map((t, idx) => {
      const isDraft = t.id === "draft-new-term"
      return convertTermDtoToProposal(t, {
        observeOfficialHolidays,
        customOffDays,
        dismissedHolidays: isDraft ? activeDismissedHolidays : undefined,
        compensatorySessions: isDraft
          ? (compensatorySessions[idx] ?? [])
          : undefined,
      })
    })
  }, [
    watchedStartDate,
    watchedEndDate,
    watchedTitle,
    watchedPhaseId,
    phases,
    observeOfficialHolidays,
    customOffDays,
    activeDismissedHolidays,
    compensatorySessions,
    phaseTerms,
    allTerms,
    t,
  ])

  const lockedTermIndex = React.useMemo(() => {
    if (proposals.length === 0) return 0
    const draftTitle = watchedTitle || t("createModal.titlePlaceholder")
    const found = proposals.findIndex(
      (p) => p.title === draftTitle || p.startDate === watchedStartDate
    )
    return found !== -1 ? found : 0
  }, [proposals, watchedTitle, watchedStartDate, t])

  const handleStartDateChange = (_index: number, newStartDate: string) => {
    if (watchedStartDate && watchedEndDate) {
      const oldStart = new Date(watchedStartDate + "T00:00:00").getTime()
      const oldEnd = new Date(watchedEndDate + "T00:00:00").getTime()
      const duration = Math.max(0, oldEnd - oldStart)
      const newEnd = new Date(
        new Date(newStartDate + "T00:00:00").getTime() + duration
      )
      setValue("endDate", newEnd.toISOString().split("T")[0]!, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
    setValue("startDate", newStartDate, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

  const handleToggleHoliday = (dateYmd: string) => {
    const next = activeDismissedHolidays.includes(dateYmd)
      ? activeDismissedHolidays.filter((d) => d !== dateYmd)
      : [...activeDismissedHolidays, dateYmd]
    setDismissedHolidaysOverride(next)
    toast.success(t("batchModal.holidayToggled"))
  }

  const handleToggleCustomOffDay = (dateYmd: string) => {
    const isCurrentlyOff = customOffDays.includes(dateYmd)
    const nextCustomOffDays = isCurrentlyOff
      ? customOffDays.filter((d) => d !== dateYmd)
      : [...customOffDays, dateYmd]
    setLocalCustomOffDays(nextCustomOffDays)

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
    setCompensatorySessions((prev) => {
      const existing = prev[termIndex] ?? []
      if (
        existing.some(
          (s) =>
            s.date === session.date && s.patternTrack === session.patternTrack
        )
      ) {
        return prev
      }
      return {
        ...prev,
        [termIndex]: [...existing, session],
      }
    })
    toast.success(t("batchModal.compensatorySessionAdded"))
  }

  const handleRemoveCompensatorySession = (
    termIndex: number,
    dateYmd: string
  ) => {
    setCompensatorySessions((prev) => {
      const existing = prev[termIndex] ?? []
      return {
        ...prev,
        [termIndex]: existing.filter((s) => s.date !== dateYmd),
      }
    })
    toast.success(t("batchModal.compensatorySessionRemoved"))
  }

  const createMutation = useMutation({
    ...termsResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      handleClose()
    },
  })

  const onSubmit = (values: CreateTermInput) => {
    createMutation.mutate({
      ...values,
      instituteId: activeInstituteId || undefined,
    })
  }

  const handleClose = () => {
    reset(DEFAULT_VALUES)
    setCompensatorySessions({})
    setLocalCustomOffDays(null)
    setDismissedHolidaysOverride(null)
    onClose()
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
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-0 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Top row: Title and Operating Phase */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.title)}>
                <FieldLabel>{t("createModal.termTitle")}</FieldLabel>
                <Input
                  {...register("title")}
                  placeholder={t("createModal.titlePlaceholder")}
                />
                <FieldError>{errors.title?.message}</FieldError>
              </Field>

              <Controller
                control={control}
                name="operatingPhaseId"
                render={({ field }) => (
                  <PhaseSelectField
                    value={field.value}
                    onChange={(id) => {
                      field.onChange(id)
                    }}
                  />
                )}
              />
            </div>

            {/* Second row: Start Date and End Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.startDate)}>
                <FieldLabel>{t("createModal.startDate")}</FieldLabel>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value || undefined}
                      onChange={(val) => field.onChange(val || "")}
                      locale={locale}
                      placeholder={t("createModal.startDate")}
                      data-invalid={Boolean(errors.startDate)}
                      showOffDays
                    />
                  )}
                />
                <FieldError>{errors.startDate?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.endDate)}>
                <FieldLabel>{t("createModal.endDate")}</FieldLabel>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value || undefined}
                      onChange={(val) => field.onChange(val || "")}
                      locale={locale}
                      placeholder={t("createModal.endDate")}
                      data-invalid={Boolean(errors.endDate)}
                      showOffDays
                    />
                  )}
                />
                <FieldError>{errors.endDate?.message}</FieldError>
              </Field>
            </div>

            <TermCalculatorSection
              startDate={watchedStartDate || ""}
              onApplyDate={(date) => setValue("endDate", date)}
            />

            {/* Embedded Interactive Calendar Preview */}
            {proposals.length > 0 && (
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-t border-border/60 pt-4">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {watchedPhaseId
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
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {t("createModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
