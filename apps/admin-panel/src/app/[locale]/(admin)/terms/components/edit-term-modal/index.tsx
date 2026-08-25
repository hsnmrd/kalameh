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
  FormDialogDescription,
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
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Spinner } from "@workspace/ui/components/spinner"
import type { TermDto } from "@workspace/types"
import { termsResource } from "@/lib/api"
import {
  useUpdateTermSchema,
  type UpdateTermInput,
} from "../../hooks/use-term-schemas"

export interface EditTermModalProps {
  term: TermDto | null
  open: boolean
  onClose: () => void
}

export function EditTermModal({ term, open, onClose }: EditTermModalProps) {
  const t = useTranslations("terms")
  const locale = useLocale() as "fa" | "en"
  const queryClient = useQueryClient()
  const updateTermSchema = useUpdateTermSchema()

  const statusOptions: ComboboxOption[] = React.useMemo(
    () => [
      { value: "true", label: t("status.active") },
      { value: "false", label: t("status.inactive") },
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
    formState: { errors },
  } = useForm<UpdateTermInput>({
    resolver: zodResolver(updateTermSchema),
    defaultValues: {
      title: "",
      startDate: "",
      endDate: "",
      isActive: true,
    },
  })

  React.useEffect(() => {
    if (term) {
      reset({
        title: term.title,
        startDate: formatDateForInput(term.startDate),
        endDate: formatDateForInput(term.endDate),
        isActive: term.isActive,
      })
    }
  }, [term, reset])

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
      <FormDialogContent className="max-w-md">
        <FormDialogHeader>
          <div className="space-y-1">
            <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
            <FormDialogDescription>
              {t("editModal.description")}
            </FormDialogDescription>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-6 sm:px-0 sm:py-0">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel>{t("editModal.termTitle")}</FieldLabel>
              <Input {...register("title")} />
              <FieldError>{errors.title?.message}</FieldError>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={Boolean(errors.startDate)}>
                <FieldLabel>{t("editModal.startDate")}</FieldLabel>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value || undefined}
                      onChange={(val) => field.onChange(val || "")}
                      locale={locale}
                      placeholder={t("editModal.startDate")}
                      data-invalid={Boolean(errors.startDate)}
                    />
                  )}
                />
                <FieldError>{errors.startDate?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.endDate)}>
                <FieldLabel>{t("editModal.endDate")}</FieldLabel>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value || undefined}
                      onChange={(val) => field.onChange(val || "")}
                      locale={locale}
                      placeholder={t("editModal.endDate")}
                      data-invalid={Boolean(errors.endDate)}
                    />
                  )}
                />
                <FieldError>{errors.endDate?.message}</FieldError>
              </Field>
            </div>

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
                    placeholder={t("status.active")}
                    drawerTitle={t("editModal.isActive")}
                    searchable={false}
                    clearable={false}
                    className="w-full"
                  />
                )}
              />
            </Field>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-xl px-4"
            >
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-10 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              {t("editModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
