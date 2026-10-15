"use client"

import { useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Info } from "lucide-react"
import { Attachment } from "@workspace/ui/components/attachment"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PasswordInput } from "@workspace/ui/components/password-input"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import type { AuthUser, CourseDto } from "@workspace/types"
import type { CreateTeacherInput } from "../../../hooks/use-teacher-schemas"
import { CourseQualificationsEditor } from "../../course-qualifications-editor"

interface FormFieldsProps {
  form: UseFormReturn<CreateTeacherInput>
  courses: CourseDto[]
  areCoursesLoading: boolean
  staffOptions: ComboboxOption[]
  selectedStaff?: AuthUser
  onSelectStaff: (userId: string | null) => void
  isStaffLoading: boolean
}

export function FormFields({
  form,
  courses,
  areCoursesLoading,
  staffOptions,
  selectedStaff,
  onSelectStaff,
  isStaffLoading,
}: FormFieldsProps) {
  const t = useTranslations("teachers")
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form

  const isLinkedUser = Boolean(watch("userId"))

  return (
    <>
      <Field className="space-y-1.5">
        <FieldLabel>{t("createModal.selectStaffUser")}</FieldLabel>
        <ResponsiveCombobox
          items={staffOptions}
          value={watch("userId") || ""}
          onValueChange={(val) => onSelectStaff(val || null)}
          placeholder={t("createModal.selectStaffUserPlaceholder")}
          drawerTitle={t("createModal.selectStaffUser")}
          clearable
          disabled={isStaffLoading}
        />
      </Field>

      {selectedStaff && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-foreground/90">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            {t("createModal.linkedUserNotice", {
              name: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
              role: t(`roles.${selectedStaff.role}`),
            })}
          </span>
        </div>
      )}

      <Field>
        <FieldLabel>{t("createModal.avatar")}</FieldLabel>
        <Controller
          control={control}
          name="avatar"
          render={({ field }) => (
            <Attachment
              value={field.value}
              onChange={(file) => field.onChange(file)}
              placeholder={t("createModal.avatarPlaceholder")}
              description={t("createModal.avatarDescription")}
              removeLabel={t("createModal.removeAvatar")}
            />
          )}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.firstName)}>
          <FieldLabel>{t("createModal.firstName")}</FieldLabel>
          <Input
            {...register("firstName")}
            placeholder={t("createModal.firstNamePlaceholder")}
            autoComplete="off"
            readOnly={isLinkedUser}
            className={isLinkedUser ? "cursor-default bg-muted/40" : undefined}
          />
          <FieldError>{errors.firstName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.lastName)}>
          <FieldLabel>{t("createModal.lastName")}</FieldLabel>
          <Input
            {...register("lastName")}
            placeholder={t("createModal.lastNamePlaceholder")}
            autoComplete="off"
            readOnly={isLinkedUser}
            className={isLinkedUser ? "cursor-default bg-muted/40" : undefined}
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
            readOnly={isLinkedUser}
            className={isLinkedUser ? "cursor-default bg-muted/40" : undefined}
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
            readOnly={isLinkedUser}
            className={isLinkedUser ? "cursor-default bg-muted/40" : undefined}
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
          {isLinkedUser ? (
            <div className="flex h-14 items-center rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 text-xs text-muted-foreground">
              {t("createModal.passwordStaffDisabledHint")}
            </div>
          ) : (
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
          )}
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
    </>
  )
}
