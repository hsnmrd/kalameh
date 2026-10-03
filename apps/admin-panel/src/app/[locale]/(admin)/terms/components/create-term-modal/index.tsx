"use client"

import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import type { TermDto } from "@workspace/types"
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useCreateTermSchema,
  type CreateTermInput,
} from "../../hooks/use-term-schemas"
import { FormContent } from "./form-content"
import { useCreateTermCalendar } from "./hooks/use-create-term-calendar"

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

export function CreateTermModal({
  open,
  onClose,
  allTerms,
}: CreateTermModalProps) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const createTermSchema = useCreateTermSchema()
  const form = useForm<CreateTermInput>({
    resolver: zodResolver(createTermSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const { control, reset, setValue } = form
  const title = useWatch({ control, name: "title" }) || ""
  const startDate = useWatch({ control, name: "startDate" })
  const endDate = useWatch({ control, name: "endDate" })
  const phaseId = useWatch({ control, name: "operatingPhaseId" })
  const calendar = useCreateTermCalendar({
    open,
    allTerms,
    title,
    startDate,
    endDate,
    phaseId,
    setValue,
  })
  const handleClose = () => {
    reset(DEFAULT_VALUES)
    calendar.reset()
    onClose()
  }
  const createMutation = useMutation({
    ...termsResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({ queryKey: termsResource.list.baseKey() })
      handleClose()
    },
  })
  const handleSubmit = (values: CreateTermInput) =>
    createMutation.mutate({
      ...values,
      instituteId: activeInstituteId || undefined,
    })

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <FormDialogContent className="sm:h-[90dvh] sm:max-w-4xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <FormContent
          form={form}
          startDate={startDate}
          phaseId={phaseId}
          proposals={calendar.proposals}
          lockedTermIndex={calendar.lockedTermIndex}
          observeOfficialHolidays={calendar.observeOfficialHolidays}
          customOffDays={calendar.customOffDays}
          dismissedHolidays={calendar.dismissedHolidays}
          compensatorySessions={calendar.compensatorySessions}
          isPending={createMutation.isPending}
          onSubmit={handleSubmit}
          onClose={handleClose}
          onStartDateChange={calendar.handleStartDateChange}
          onToggleHoliday={calendar.handleToggleHoliday}
          onToggleCustomOffDay={calendar.handleToggleCustomOffDay}
          onAddCompensatorySession={calendar.addCompensatorySession}
          onRemoveCompensatorySession={calendar.removeCompensatorySession}
        />
      </FormDialogContent>
    </FormDialog>
  )
}
