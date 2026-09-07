"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { type TeacherDto } from "@workspace/types"
import { teachersResource } from "@/lib/api"
import {
  useUpdateTeacherSchema,
  type UpdateTeacherInput,
} from "../../hooks/use-teacher-schemas"
import { AvailabilityEditor } from "../availability-editor"

export interface EditTeacherModalProps {
  teacher: TeacherDto | null
  open: boolean
  onClose: () => void
}

export function EditTeacherModal({
  teacher,
  open,
  onClose,
}: EditTeacherModalProps) {
  const t = useTranslations("teachers")
  const queryClient = useQueryClient()
  const updateTeacherSchema = useUpdateTeacherSchema()

  const statusOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "true", label: t("status.active") },
      { value: "false", label: t("status.inactive") },
    ]
  }, [t])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateTeacherInput>({
    resolver: zodResolver(updateTeacherSchema),
  })

  React.useEffect(() => {
    if (teacher && open) {
      reset({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        nationalCode: teacher.nationalCode || "",
        degree: teacher.teacherProfile?.degree || "",
        bio: teacher.teacherProfile?.bio || "",
        isActive: teacher.isActive,
        availabilities:
          teacher.teacherProfile?.availabilities?.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          })) || [],
      })
    }
  }, [teacher, open, reset])

  const updateMutation = useMutation({
    ...teachersResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: teachersResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = async (data: UpdateTeacherInput) => {
    if (!teacher) return

    const formData = new FormData()
    if (data.firstName) formData.append("firstName", data.firstName)
    if (data.lastName) formData.append("lastName", data.lastName)
    if (data.phone) formData.append("phone", data.phone)
    if (data.nationalCode !== undefined)
      formData.append("nationalCode", data.nationalCode || "")
    if (data.degree !== undefined) formData.append("degree", data.degree || "")
    if (data.bio !== undefined) formData.append("bio", data.bio || "")
    if (data.isActive !== undefined)
      formData.append("isActive", String(data.isActive))

    if (data.availabilities) {
      data.availabilities.forEach((slot, index) => {
        formData.append(`availabilities[${index}][dayOfWeek]`, slot.dayOfWeek)
        formData.append(`availabilities[${index}][startTime]`, slot.startTime)
        formData.append(`availabilities[${index}][endTime]`, slot.endTime)
      })
    }

    updateMutation.mutate({
      id: teacher.id,
      body: formData as any,
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <FormDialogContent className="sm:max-w-xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-4 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.firstName)}>
                <FieldLabel>{t("createModal.firstName")}</FieldLabel>
                <Input
                  {...register("firstName")}
                  placeholder={t("createModal.firstNamePlaceholder")}
                />
                <FieldError>{errors.firstName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.lastName)}>
                <FieldLabel>{t("createModal.lastName")}</FieldLabel>
                <Input
                  {...register("lastName")}
                  placeholder={t("createModal.lastNamePlaceholder")}
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
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.nationalCode)}>
                <FieldLabel>{t("createModal.nationalCode")}</FieldLabel>
                <Input
                  {...register("nationalCode")}
                  placeholder={t("createModal.nationalCodePlaceholder")}
                  dir="ltr"
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
                />
                <FieldError>{errors.degree?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel>{t("editModal.status")}</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={statusOptions}
                      value={field.value ? "true" : "false"}
                      onValueChange={(val) => field.onChange(val === "true")}
                      drawerTitle={t("editModal.status")}
                    />
                  )}
                />
              </Field>
            </div>

            <Field data-invalid={Boolean(errors.bio)}>
              <FieldLabel>{t("createModal.bio")}</FieldLabel>
              <Input
                {...register("bio")}
                placeholder={t("createModal.bioPlaceholder")}
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
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {t("editModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
