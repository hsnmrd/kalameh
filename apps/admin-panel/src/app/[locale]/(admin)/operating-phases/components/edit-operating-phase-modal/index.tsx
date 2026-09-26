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
import {
  calculatePhaseSlots,
  suggestPhaseBreakWindow,
  type OperatingPhaseWithSlots,
  type WeekDay,
} from "@workspace/types"
import { operatingPhasesResource } from "@/lib/api"
import {
  useUpdateOperatingPhaseSchema,
  type UpdateOperatingPhaseInput,
} from "../../hooks/use-operating-phase-schemas"
import { PhaseSlotsReview } from "../phase-slots-review"
import { FormStep } from "./form-step"

export interface EditOperatingPhaseModalProps {
  phase: OperatingPhaseWithSlots | null
  open: boolean
  onClose: () => void
}

const EMPTY_VALUES: UpdateOperatingPhaseInput = {
  title: "",
  months: [],
  startTime: "15:00",
  endTime: "21:00",
  slotDurationMinutes: 90,
  daysOfWeek: [],
  hasBreak: false,
  breakStartTime: "18:00",
  breakEndTime: "19:00",
  isActive: true,
  order: 0,
}

export function EditOperatingPhaseModal({
  phase,
  open,
  onClose,
}: EditOperatingPhaseModalProps) {
  const t = useTranslations("operating-phases")
  const queryClient = useQueryClient()
  const updateSchema = useUpdateOperatingPhaseSchema()
  const [step, setStep] = React.useState<"form" | "review">("form")
  const formValues = React.useMemo<UpdateOperatingPhaseInput>(
    () =>
      phase
        ? {
            title: phase.title,
            months: phase.months,
            startTime: phase.startTime,
            endTime: phase.endTime,
            slotDurationMinutes: phase.slotDurationMinutes,
            daysOfWeek: phase.daysOfWeek as WeekDay[],
            hasBreak: phase.hasBreak ?? false,
            breakStartTime: phase.breakStartTime || "18:00",
            breakEndTime: phase.breakEndTime || "19:00",
            isActive: phase.isActive,
            order: phase.order,
          }
        : EMPTY_VALUES,
    [phase]
  )

  const form = useForm<UpdateOperatingPhaseInput>({
    resolver: zodResolver(updateSchema),
    defaultValues: EMPTY_VALUES,
    values: formValues,
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
        startTime || phase?.startTime || "15:00",
        endTime || phase?.endTime || "21:00",
        Number(duration) || phase?.slotDurationMinutes || 90,
        60
      ),
    [startTime, endTime, duration, phase]
  )
  const calculation = React.useMemo(
    () =>
      calculatePhaseSlots(
        startTime || phase?.startTime || "15:00",
        endTime || phase?.endTime || "21:00",
        Number(duration) || phase?.slotDurationMinutes || 90,
        {
          hasBreak:
            hasBreak !== undefined ? hasBreak : Boolean(phase?.hasBreak),
          breakStartTime: breakStartTime || phase?.breakStartTime || "18:00",
          breakEndTime: breakEndTime || phase?.breakEndTime || "19:00",
        }
      ),
    [
      startTime,
      endTime,
      duration,
      hasBreak,
      breakStartTime,
      breakEndTime,
      phase,
    ]
  )

  const handleClose = React.useCallback(() => {
    setStep("form")
    reset(formValues)
    onClose()
  }, [formValues, onClose, reset])

  const updateMutation = useMutation({
    ...operatingPhasesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("notifications.updated"))
      queryClient.invalidateQueries({
        queryKey: operatingPhasesResource.list.baseKey(),
      })
      handleClose()
    },
  })

  const handleConfirm = () => {
    if (!phase) return
    const values = getValues()
    updateMutation.mutate({
      id: phase.id,
      body: {
        ...values,
        slotDurationMinutes: Number(values.slotDurationMinutes) || 90,
        hasBreak: values.hasBreak,
        breakStartTime: values.hasBreak ? values.breakStartTime : null,
        breakEndTime: values.hasBreak ? values.breakEndTime : null,
      },
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>
            {step === "form" ? t("editPhase") : t("review.title")}
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
            isPending={updateMutation.isPending}
            onSubmit={() => setStep("review")}
            onCancel={handleClose}
          />
        ) : (
          <PhaseSlotsReview
            title={title || phase?.title || t("review.phaseInfo")}
            months={months || phase?.months || []}
            startTime={startTime || phase?.startTime || "15:00"}
            endTime={endTime || phase?.endTime || "21:00"}
            slotDurationMinutes={
              Number(duration) || phase?.slotDurationMinutes || 90
            }
            hasBreak={hasBreak}
            breakStartTime={breakStartTime}
            breakEndTime={breakEndTime}
            calculation={calculation}
            onEditAgain={() => setStep("form")}
            onConfirm={handleConfirm}
            isSubmitting={updateMutation.isPending}
            confirmText={t("review.confirmAndUpdate")}
          />
        )}
      </FormDialogContent>
    </FormDialog>
  )
}
