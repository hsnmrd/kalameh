"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { DateInput } from "@workspace/ui/components/date-input"
import { Spinner } from "@workspace/ui/components/spinner"
import type { StudentDto } from "@workspace/types"
import { coursesResource, studentsResource } from "@/lib/api"
import {
  useUpdateStudentSchema,
  type UpdateStudentInput,
} from "../../hooks/use-student-schemas"

export interface EditStudentModalProps {
  student: StudentDto | null
  open: boolean
  onClose: () => void
}

export function EditStudentModal({
  student,
  open,
  onClose,
}: EditStudentModalProps) {
  const t = useTranslations("students")
  const locale = useLocale() as "fa" | "en"
  const queryClient = useQueryClient()
  const updateStudentSchema = useUpdateStudentSchema()

  const { data: courses = [] } = useQuery({
    ...coursesResource.list.toQuery(
      student?.instituteId ? { instituteId: student.instituteId } : undefined
    ),
    enabled: open && !!student?.instituteId,
  })

  const genderOptions: ComboboxOption[] = React.useMemo(
    () => [
      { value: "MALE", label: t("createModal.genderMale") },
      { value: "FEMALE", label: t("createModal.genderFemale") },
    ],
    [t]
  )

  const courseOptions: ComboboxOption[] = React.useMemo(
    () => [
      { value: "ROOT", label: t("createModal.selectCourse") },
      ...courses.map((c) => ({ value: c.id, label: c.title })),
    ],
    [courses, t]
  )

  const statusOptions: ComboboxOption[] = React.useMemo(
    () => [
      { value: "ACTIVE", label: t("status.active") },
      { value: "INACTIVE", label: t("status.inactive") },
    ],
    [t]
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
  })

  // Populate form with student values when student changes
  React.useEffect(() => {
    if (student) {
      const birthDateStr = student.studentProfile?.birthDate
        ? new Date(student.studentProfile.birthDate).toISOString().split("T")[0]
        : ""

      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        nationalCode: student.nationalCode || "",
        fatherName: student.studentProfile?.fatherName || "",
        birthDate: birthDateStr || "",
        gender: student.studentProfile?.gender || "",
        emergencyPhone: student.studentProfile?.emergencyPhone || "",
        address: student.studentProfile?.address || "",
        notes: student.studentProfile?.notes || "",
        currentAllowedCourseId: student.currentAllowedCourseId || null,
        isActive: student.isActive,
      })
    }
  }, [student, reset])

  const updateMutation = useMutation({
    ...studentsResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: studentsResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: UpdateStudentInput) => {
    if (!student) return

    updateMutation.mutate({
      id: student.id,
      body: {
        ...values,
        nationalCode: values.nationalCode || null,
        fatherName: values.fatherName || null,
        birthDate: values.birthDate || null,
        gender: values.gender || null,
        emergencyPhone: values.emergencyPhone || null,
        address: values.address || null,
        notes: values.notes || null,
        currentAllowedCourseId:
          values.currentAllowedCourseId === "ROOT"
            ? null
            : values.currentAllowedCourseId || null,
      },
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-6 sm:px-0 sm:py-0">
            {/* Identity Info */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.firstName)}>
                <FieldLabel>{t("editModal.firstName")}</FieldLabel>
                <Input {...register("firstName")} />
                <FieldError>{errors.firstName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.lastName)}>
                <FieldLabel>{t("editModal.lastName")}</FieldLabel>
                <Input {...register("lastName")} />
                <FieldError>{errors.lastName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel>{t("editModal.phone")}</FieldLabel>
                <Input
                  type="tel"
                  dir="ltr"
                  {...register("phone")}
                  className="text-start font-mono"
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.nationalCode)}>
                <FieldLabel>{t("editModal.nationalCode")}</FieldLabel>
                <Input
                  dir="ltr"
                  {...register("nationalCode")}
                  className="text-start font-mono"
                />
                <FieldDescription>
                  {t("editModal.nationalCodeHint")}
                </FieldDescription>
                <FieldError>{errors.nationalCode?.message}</FieldError>
              </Field>
            </div>

            {/* Profile & Guardian */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.fatherName)}>
                <FieldLabel>{t("editModal.fatherName")}</FieldLabel>
                <Input {...register("fatherName")} />
                <FieldError>{errors.fatherName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.emergencyPhone)}>
                <FieldLabel>{t("editModal.emergencyPhone")}</FieldLabel>
                <Input
                  type="tel"
                  dir="ltr"
                  {...register("emergencyPhone")}
                  className="text-start font-mono"
                />
                <FieldError>{errors.emergencyPhone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.gender)}>
                <FieldLabel>{t("editModal.gender")}</FieldLabel>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={genderOptions}
                      value={field.value || undefined}
                      onValueChange={(val) => field.onChange(val || "")}
                      placeholder={t("createModal.genderSelect")}
                      drawerTitle={t("editModal.gender")}
                      searchable={false}
                      data-invalid={Boolean(errors.gender)}
                    />
                  )}
                />
                <FieldError>{errors.gender?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.birthDate)}>
                <FieldLabel>{t("editModal.birthDate")}</FieldLabel>
                <Controller
                  control={control}
                  name="birthDate"
                  render={({ field }) => (
                    <DateInput
                      value={field.value || undefined}
                      onChange={(val) => field.onChange(val || "")}
                      locale={locale}
                      placeholderYear={locale === "fa" ? "۱۳۸۰" : "YYYY"}
                      placeholderMonth={locale === "fa" ? "ماه" : "MM"}
                      placeholderDay={locale === "fa" ? "روز" : "DD"}
                      data-invalid={Boolean(errors.birthDate)}
                    />
                  )}
                />
                <FieldError>{errors.birthDate?.message}</FieldError>
              </Field>

              <div className="col-span-1 sm:col-span-2">
                <Field data-invalid={Boolean(errors.address)}>
                  <FieldLabel>{t("editModal.address")}</FieldLabel>
                  <Input {...register("address")} />
                  <FieldError>{errors.address?.message}</FieldError>
                </Field>
              </div>
            </div>

            {/* Academic Level & Status */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.currentAllowedCourseId)}>
                <FieldLabel>{t("editModal.currentAllowedCourseId")}</FieldLabel>
                <Controller
                  control={control}
                  name="currentAllowedCourseId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={courseOptions}
                      value={field.value || "ROOT"}
                      onValueChange={(val) =>
                        field.onChange(val === "ROOT" ? null : val || null)
                      }
                      placeholder={t("createModal.selectCourse")}
                      drawerTitle={t("editModal.currentAllowedCourseId")}
                      clearable={false}
                      data-invalid={Boolean(errors.currentAllowedCourseId)}
                    />
                  )}
                />
                <FieldError>
                  {errors.currentAllowedCourseId?.message}
                </FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.isActive)}>
                <FieldLabel>{t("editModal.isActive")}</FieldLabel>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={statusOptions}
                      value={field.value ? "ACTIVE" : "INACTIVE"}
                      onValueChange={(val) => field.onChange(val === "ACTIVE")}
                      drawerTitle={t("editModal.isActive")}
                      searchable={false}
                      clearable={false}
                      data-invalid={Boolean(errors.isActive)}
                    />
                  )}
                />
                <FieldError>{errors.isActive?.message}</FieldError>
              </Field>
            </div>
          </div>

          {/* Actions */}
          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-xl"
            >
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              <span>{t("editModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
