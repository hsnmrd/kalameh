"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
} from "@workspace/ui/components/dialog"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import type { TermDto } from "@workspace/types"
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useUpdateTermSchema,
  type UpdateTermInput,
} from "../../hooks/use-term-schemas"
import { EditTermFormContent } from "./form-content"
import {
  buildEditTermFormValues,
  EMPTY_TERM_VALUES,
} from "./helper/build-edit-term-form-values"
import { useEditTermCompensatoryActions } from "./hooks/use-edit-term-compensatory-actions"
import { useEditTermDateActions } from "./hooks/use-edit-term-date-actions"
import {
  formatDateForInput,
  useEditTermCalendarState,
} from "./hooks/use-edit-term-calendar-state"

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
    () => buildEditTermFormValues(term),
    [term]
  )

  const form = useForm<UpdateTermInput>({
    resolver: zodResolver(updateTermSchema),
    defaultValues: EMPTY_TERM_VALUES,
    values: formValues,
  })
  const { control, reset, setValue } = form

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

  const {
    classPatterns,
    compensatorySessions,
    customOffDays,
    daysOfWeek,
    dismissedHolidays: activeDismissedHolidays,
    lockedTermIndex,
    observeOfficialHolidays,
    proposals,
    rawCustomOffDays,
    setCompensatorySessions,
    setDismissedHolidaysOverride,
    setLocalCustomOffDays,
    setProposalDraft,
    setProposals,
    standardSessionsCount,
    targetPhaseId,
  } = useEditTermCalendarState({
    term,
    allTerms,
    open,
    activeInstituteId,
    watchedPhaseId,
    watchedTitle,
    originalStartDate,
  })

  const {
    handleStartDateChange,
    handleToggleHoliday,
    handleToggleCustomOffDay,
  } = useEditTermDateActions({
    activeInstituteId,
    proposals,
    setProposals,
    lockedTermIndex,
    standardSessionsCount,
    daysOfWeek,
    classPatterns,
    watchedTitle,
    termTitle: term?.title,
    observeOfficialHolidays,
    customOffDays,
    rawCustomOffDays,
    dismissedHolidays: activeDismissedHolidays,
    setDismissedHolidays: setDismissedHolidaysOverride,
    setLocalCustomOffDays,
    compensatorySessions,
    setValue,
  })
  const { handleAddCompensatorySession, handleRemoveCompensatorySession } =
    useEditTermCompensatoryActions({
      proposals,
      setProposals,
      lockedTermIndex,
      standardSessionsCount,
      daysOfWeek,
      classPatterns,
      watchedTitle,
      termTitle: term?.title,
      observeOfficialHolidays,
      customOffDays,
      dismissedHolidays: activeDismissedHolidays,
      compensatorySessions,
      setCompensatorySessions,
      setValue,
    })

  const handleClose = React.useCallback(() => {
    reset(formValues)
    setDismissedHolidaysOverride(null)
    setLocalCustomOffDays(null)
    setCompensatorySessions({})
    setProposalDraft(null)
    onClose()
  }, [
    formValues,
    onClose,
    reset,
    setCompensatorySessions,
    setDismissedHolidaysOverride,
    setLocalCustomOffDays,
    setProposalDraft,
  ])

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

        <EditTermFormContent
          form={form}
          statusOptions={statusOptions}
          proposals={proposals}
          lockedTermIndex={lockedTermIndex}
          targetPhaseId={targetPhaseId}
          classesCount={classesCount}
          isDateChanged={isDateChanged}
          isPending={updateMutation.isPending}
          observeOfficialHolidays={observeOfficialHolidays}
          customOffDays={customOffDays}
          activeDismissedHolidays={activeDismissedHolidays}
          compensatorySessions={compensatorySessions}
          onStartDateChange={handleStartDateChange}
          onToggleHoliday={handleToggleHoliday}
          onToggleCustomOffDay={handleToggleCustomOffDay}
          onAddCompensatorySession={handleAddCompensatorySession}
          onRemoveCompensatorySession={handleRemoveCompensatorySession}
          onSubmit={onSubmit}
          onClose={handleClose}
        />
      </FormDialogContent>
    </FormDialog>
  )
}
