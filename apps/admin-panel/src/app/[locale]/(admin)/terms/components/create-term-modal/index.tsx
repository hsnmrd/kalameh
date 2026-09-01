"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import type { SupportedLocale } from "@workspace/types"
import {
  useCreateTermSchema,
  type CreateTermInput,
} from "../../hooks/use-term-schemas"

export interface CreateTermModalProps {
  open: boolean
  onClose: () => void
}

export function CreateTermModal({ open, onClose }: CreateTermModalProps) {
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
    formState: { errors },
  } = useForm<CreateTermInput>({
    resolver: zodResolver(createTermSchema),
    defaultValues: {
      title: "",
      startDate: "",
      endDate: "",
      isActive: true,
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({
        title: "",
        startDate: "",
        endDate: "",
        isActive: true,
      })
    }
  }, [open, reset])

  const createMutation = useMutation({
    ...termsResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: CreateTermInput) => {
    createMutation.mutate({
      ...values,
      instituteId: activeInstituteId || undefined,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel>{t("createModal.termTitle")}</FieldLabel>
              <Input
                {...register("title")}
                placeholder={t("createModal.titlePlaceholder")}
              />
              <FieldError>{errors.title?.message}</FieldError>
            </Field>

            <div className="grid grid-cols-2 gap-3">
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
                    />
                  )}
                />
                <FieldError>{errors.endDate?.message}</FieldError>
              </Field>
            </div>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
