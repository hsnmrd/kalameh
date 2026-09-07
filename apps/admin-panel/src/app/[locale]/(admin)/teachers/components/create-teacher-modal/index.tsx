"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { teachersResource } from "@/lib/api"
import {
  useCreateTeacherSchema,
  type CreateTeacherInput,
} from "../../hooks/use-teacher-schemas"
import { AvailabilityEditor } from "../availability-editor"

export interface CreateTeacherModalProps {
  open: boolean
  onClose: () => void
  instituteId?: string
}

export function CreateTeacherModal({
  open,
  onClose,
  instituteId,
}: CreateTeacherModalProps) {
  const t = useTranslations("teachers")
  const queryClient = useQueryClient()
  const createTeacherSchema = useCreateTeacherSchema()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateTeacherInput>({
    resolver: zodResolver(createTeacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      nationalCode: "",
      password: "",
      degree: "",
      bio: "",
      availabilities: [],
      instituteId,
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({
        firstName: "",
        lastName: "",
        phone: "",
        nationalCode: "",
        password: "",
        degree: "",
        bio: "",
        availabilities: [],
        instituteId,
      })
    }
  }, [open, reset, instituteId])

  const createMutation = useMutation({
    ...teachersResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: teachersResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = async (data: CreateTeacherInput) => {
    const formData = new FormData()
    formData.append("firstName", data.firstName)
    formData.append("lastName", data.lastName)
    formData.append("phone", data.phone)

    if (data.nationalCode) formData.append("nationalCode", data.nationalCode)
    if (data.password) formData.append("password", data.password)
    if (data.degree) formData.append("degree", data.degree)
    if (data.bio) formData.append("bio", data.bio)
    if (instituteId) formData.append("instituteId", instituteId)

    if (data.availabilities && data.availabilities.length > 0) {
      data.availabilities.forEach((slot, index) => {
        formData.append(`availabilities[${index}][dayOfWeek]`, slot.dayOfWeek)
        formData.append(`availabilities[${index}][startTime]`, slot.startTime)
        formData.append(`availabilities[${index}][endTime]`, slot.endTime)
      })
    }

    createMutation.mutate(formData as any)
  }

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <FormDialogContent className="sm:max-w-xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
          data-form-type="other"
          className="flex min-h-0 flex-1 flex-col justify-between gap-4 overflow-hidden"
        >
          {/* Hidden dummy inputs to absorb aggressive browser credential autofill */}
          <div
            className="pointer-events-none sr-only absolute -top-96 -left-96"
            aria-hidden="true"
          >
            <Input
              type="text"
              name="prevent_autofill_username"
              tabIndex={-1}
              autoComplete="username"
              readOnly
            />
            <Input
              type="password"
              name="prevent_autofill_password"
              tabIndex={-1}
              autoComplete="current-password"
              readOnly
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.firstName)}>
                <FieldLabel>{t("createModal.firstName")}</FieldLabel>
                <Input
                  {...register("firstName")}
                  placeholder={t("createModal.firstNamePlaceholder")}
                  autoComplete="off"
                />
                <FieldError>{errors.firstName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.lastName)}>
                <FieldLabel>{t("createModal.lastName")}</FieldLabel>
                <Input
                  {...register("lastName")}
                  placeholder={t("createModal.lastNamePlaceholder")}
                  autoComplete="off"
                />
                <FieldError>{errors.lastName?.message}</FieldError>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel>{t("createModal.phone")}</FieldLabel>
                <Input
                  {...register("phone")}
                  placeholder={t("createModal.phonePlaceholder")}
                  dir="ltr"
                  autoComplete="off"
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.nationalCode)}>
                <FieldLabel>{t("createModal.nationalCode")}</FieldLabel>
                <Input
                  {...register("nationalCode")}
                  placeholder={t("createModal.nationalCodePlaceholder")}
                  dir="ltr"
                  autoComplete="off"
                />
                <FieldError>{errors.nationalCode?.message}</FieldError>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.degree)}>
                <FieldLabel>{t("createModal.degree")}</FieldLabel>
                <Input
                  {...register("degree")}
                  placeholder={t("createModal.degreePlaceholder")}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                />
                <FieldError>{errors.degree?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor="new-teacher-password">
                  {t("createModal.password")}
                </FieldLabel>
                <Controller
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <PasswordInput
                      {...field}
                      id="new-teacher-password"
                      name="new-teacher-password"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      placeholder={t("createModal.passwordPlaceholder")}
                      dir="ltr"
                    />
                  )}
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.bio)}>
              <FieldLabel>{t("createModal.bio")}</FieldLabel>
              <Input
                {...register("bio")}
                placeholder={t("createModal.bioPlaceholder")}
                autoComplete="off"
              />
              <FieldError>{errors.bio?.message}</FieldError>
            </Field>

            {/* Weekly Free-Time Availability Schedule */}
            <Controller
              control={control}
              name="availabilities"
              render={({ field }) => (
                <AvailabilityEditor
                  value={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
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
