"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Spinner } from "@workspace/ui/components/spinner"
import { termsResource } from "@/lib/api"
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
  const locale = useLocale() as "fa" | "en"
  const queryClient = useQueryClient()
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
    createMutation.mutate(values)
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("createModal.title")}</DialogTitle>
          <DialogDescription>{t("createModal.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel>{t("createModal.termTitle")}</FieldLabel>
            <Input
              {...register("title")}
              placeholder="پاییز ۱۴۰۵"
              className="h-10 rounded-xl"
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

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-xl px-4"
            >
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              {t("createModal.submit")}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
