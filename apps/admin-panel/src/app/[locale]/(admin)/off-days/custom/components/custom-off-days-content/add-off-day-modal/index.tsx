"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Info } from "lucide-react"
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
import { DateRangePicker } from "@workspace/ui/components/date-range-picker"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  CreateInstituteCustomOffDaySchema,
  type CreateInstituteCustomOffDayInput,
} from "@workspace/types"
import { institutesResource } from "@/lib/api"

export interface AddOffDayModalProps {
  open: boolean
  onClose: () => void
  instituteId: string
  observeOfficialHolidays?: boolean
  existingOffDays?: string[]
  defaultDate?: string
}

export function AddOffDayModal({
  open,
  onClose,
  instituteId,
  observeOfficialHolidays = true,
  existingOffDays = [],
  defaultDate,
}: AddOffDayModalProps) {
  const t = useTranslations("setting.offDays")
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateInstituteCustomOffDayInput>({
    resolver: zodResolver(CreateInstituteCustomOffDaySchema),
    defaultValues: {
      date: defaultDate || "",
      startDate: defaultDate || "",
      endDate: defaultDate || "",
      title: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({
        date: defaultDate || "",
        startDate: defaultDate || "",
        endDate: defaultDate || "",
        title: "",
      })
    }
  }, [open, defaultDate, reset])

  const startDate = useWatch({ control, name: "startDate" })
  const endDate = useWatch({ control, name: "endDate" })

  const rangeDaysCount = React.useMemo(() => {
    if (!startDate) return 0
    try {
      const from = new Date(startDate + "T12:00:00Z")
      const to = new Date((endDate || startDate) + "T12:00:00Z")
      const diff =
        Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return Math.max(1, diff)
    } catch {
      return 0
    }
  }, [startDate, endDate])

  const createMutation = useMutation({
    ...institutesResource.createCustomOffDay.toMutation(),
    onSuccess: () => {
      toast.success(t("successAddOffDay"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.customOffDays.baseKey(),
      })
      handleClose()
    },
  })

  const handleClose = () => {
    reset({ date: "", startDate: "", endDate: "", title: "" })
    onClose()
  }

  const onSubmit = (data: CreateInstituteCustomOffDayInput) => {
    if (!instituteId) return

    const isSingle = !data.endDate || data.startDate === data.endDate
    const payload: CreateInstituteCustomOffDayInput = isSingle
      ? {
          date: data.startDate || data.date,
          title: data.title,
        }
      : {
          startDate: data.startDate,
          endDate: data.endDate,
          title: data.title,
        }

    createMutation.mutate({
      id: instituteId,
      body: payload,
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("addModalTitle")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Date Range Picker (supports single date and date range) */}
            <Field>
              <FieldLabel>{t("date")}</FieldLabel>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DateRangePicker
                    value={{ from: field.value, to: endDate }}
                    onChange={(range) => {
                      field.onChange(range?.from ?? "")
                      setValue("date", range?.from ?? "")
                      setValue("endDate", range?.to ?? "", {
                        shouldValidate: true,
                      })
                    }}
                    placeholder={t("datePlaceholder")}
                    data-invalid={
                      !!errors.startDate || !!errors.date || !!errors.endDate
                    }
                    showOffDays={true}
                    observeOfficialHolidays={observeOfficialHolidays}
                    offDays={existingOffDays}
                  />
                )}
              />
              {rangeDaysCount > 1 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5 text-primary" />
                  <span>{t("daysCount", { count: rangeDaysCount })}</span>
                </div>
              )}
              {(errors.startDate || errors.date || errors.endDate) && (
                <FieldError>
                  {errors.startDate?.message ||
                    errors.date?.message ||
                    errors.endDate?.message}
                </FieldError>
              )}
            </Field>

            {/* Title Field */}
            <Field>
              <FieldLabel>{t("offDayTitle")}</FieldLabel>
              <Input
                {...register("title")}
                placeholder={t("titlePlaceholder")}
                className="h-14 rounded-2xl px-4 text-base"
                data-invalid={!!errors.title}
              />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </Field>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <span>{t("save")}</span>
              )}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
