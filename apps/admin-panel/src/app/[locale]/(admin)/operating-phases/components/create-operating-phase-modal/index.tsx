"use client"

import * as React from "react"
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
import { calculatePhaseSlots, suggestPhaseBreakWindow } from "@workspace/types"
import { operatingPhasesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useCreateOperatingPhaseSchema,
  type CreateOperatingPhaseInput,
} from "../../hooks/use-operating-phase-schemas"
import { PhaseSlotsReview } from "../phase-slots-review"
import { FormStep } from "./form-step"

export interface CreateOperatingPhaseModalProps {
  open: boolean
  onClose: () => void
}

const DEFAULT_VALUES: CreateOperatingPhaseInput = {
  title: "",
  months: [7, 8, 9, 10, 11, 12, 1, 2, 3],
  startTime: "15:00",
  endTime: "21:00",
  slotDurationMinutes: 90,
  daysOfWeek: [
    "SATURDAY",
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
  ],
  hasBreak: false,
  breakStartTime: "18:00",
  breakEndTime: "19:00",
  isActive: true,
  order: 0,
}

export function CreateOperatingPhaseModal({
  open,
  onClose,
}: CreateOperatingPhaseModalProps) {
  const t = useTranslations("operating-phases")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const createSchema = useCreateOperatingPhaseSchema()
  const [step, setStep] = React.useState<"form" | "review">("form")

  const form = useForm<CreateOperatingPhaseInput>({
    resolver: zodResolver(createSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const { control, reset, getValues } = form
  const title = useWatch({ control, name: "title" })
  const months = useWatch({ control, name: "months" })
  const startTime = useWatch({ control, name: "startTime" })
  const endTime = useWatch({ control, name: "endTime" })
  const duration = useWatch({ control, name: "slotDurationMinutes" })
  const hasBreak = useWatch({ control, name: "hasBreak" })
  const breakStartTime = useWatch({ control, name: "breakStartTime" })
  const breakEndTime = useWatch({ control, name: "breakEndTime" })

  const suggestedBreak = React.useMemo(
    () =>
      suggestPhaseBreakWindow(
        startTime || "15:00",
        endTime || "21:00",
        Number(duration) || 90,
        60
      ),
    [startTime, endTime, duration]
  )
  const calculation = React.useMemo(
    () =>
      calculatePhaseSlots(
        startTime || "15:00",
        endTime || "21:00",
        Number(duration) || 90,
        { hasBreak, breakStartTime, breakEndTime }
      ),
    [startTime, endTime, duration, hasBreak, breakStartTime, breakEndTime]
  )

  const handleClose = React.useCallback(() => {
    setStep("form")
    reset(DEFAULT_VALUES)
    onClose()
  }, [onClose, reset])

  const createMutation = useMutation({
    ...operatingPhasesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("notifications.created"))
      queryClient.invalidateQueries({
        queryKey: operatingPhasesResource.list.baseKey(),
      })
      handleClose()
    },
  })

  const handleConfirm = () => {
    const values = getValues()
    createMutation.mutate({
      ...values,
      slotDurationMinutes: Number(values.slotDurationMinutes) || 90,
      instituteId: activeInstituteId || undefined,
      hasBreak: values.hasBreak,
      breakStartTime: values.hasBreak ? values.breakStartTime : null,
      breakEndTime: values.hasBreak ? values.breakEndTime : null,
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>
            {step === "form" ? t("addPhase") : t("review.title")}
          </FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        {step === "form" ? (
          <FormStep
            form={form}
            months={months}
            hasBreak={hasBreak}
            breakStartTime={breakStartTime}
            breakEndTime={breakEndTime}
            duration={duration}
            suggestedBreak={suggestedBreak}
            calculation={calculation}
            isPending={createMutation.isPending}
            onSubmit={() => setStep("review")}
            onCancel={handleClose}
          />
        ) : (
          <PhaseSlotsReview
            title={title || t("review.phaseInfo")}
            months={months || []}
            startTime={startTime || "15:00"}
            endTime={endTime || "21:00"}
            slotDurationMinutes={Number(duration) || 90}
            hasBreak={hasBreak}
            breakStartTime={breakStartTime}
            breakEndTime={breakEndTime}
            calculation={calculation}
            onEditAgain={() => setStep("form")}
            onConfirm={handleConfirm}
            isSubmitting={createMutation.isPending}
            confirmText={t("review.confirmAndCreate")}
          />
        )}
      </FormDialogContent>
    </FormDialog>
  )
}
