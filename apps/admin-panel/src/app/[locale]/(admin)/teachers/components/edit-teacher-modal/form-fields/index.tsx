"use client"

import { Controller, type UseFormReturn } from "react-hook-form"
import { useTranslations } from "next-intl"
import type { CourseDto } from "@workspace/types"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import type { UpdateTeacherInput } from "../../../hooks/use-teacher-schemas"
import { AvailabilityEditor } from "../../availability-editor"
import { CourseQualificationsEditor } from "../../course-qualifications-editor"

interface FormFieldsProps {
  form: UseFormReturn<UpdateTeacherInput>
  courses: CourseDto[]
  areCoursesLoading: boolean
  statusOptions: ComboboxOption[]
}

export function FormFields({
  form,
  courses,
  areCoursesLoading,
  statusOptions,
}: FormFieldsProps) {
  const t = useTranslations("teachers")
  const {
    register,
    control,
    formState: { errors },
  } = form

  return (
    <>
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
                onValueChange={(value) => field.onChange(value === "true")}
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

      <Controller
        control={control}
        name="courseIds"
        render={({ field }) => (
          <CourseQualificationsEditor
            courses={courses}
            value={field.value ?? []}
            onChange={field.onChange}
            isLoading={areCoursesLoading}
          />
        )}
      />
      <Controller
        control={control}
        name="availabilities"
        render={({ field }) => (
          <AvailabilityEditor
            value={field.value ?? []}
            onChange={field.onChange}
          />
        )}
      />
    </>
  )
}
