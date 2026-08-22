"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { PasswordInput } from "@workspace/ui/components/password-input"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@workspace/ui/components/field"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Spinner } from "@workspace/ui/components/spinner"
import { coursesResource, studentsResource } from "@/lib/api"
import {
  useCreateStudentSchema,
  type CreateStudentInput,
} from "../../hooks/use-student-schemas"

export interface CreateStudentModalProps {
  open: boolean
  onClose: () => void
  instituteId?: string
}

export function CreateStudentModal({
  open,
  onClose,
  instituteId,
}: CreateStudentModalProps) {
  const t = useTranslations("students")
  const locale = useLocale() as "fa" | "en"
  const queryClient = useQueryClient()
  const createStudentSchema = useCreateStudentSchema()

  // Fetch courses to let admin choose allowed course
  const { data: courses = [] } = useQuery(
    coursesResource.list.toQuery(instituteId ? { instituteId } : undefined)
  )

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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      nationalCode: "",
      fatherName: "",
      birthDate: "",
      gender: "",
      emergencyPhone: "",
      address: "",
      notes: "",
      currentAllowedCourseId: null,
      password: "",
    },
  })

  const createMutation = useMutation({
    ...studentsResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: studentsResource.list.baseKey(),
      })
      reset()
      onClose()
    },
  })

  const onSubmit = (values: CreateStudentInput) => {
    createMutation.mutate({
      ...values,
      instituteId: instituteId || values.instituteId || undefined,
      nationalCode: values.nationalCode || undefined,
      fatherName: values.fatherName || undefined,
      birthDate: values.birthDate || undefined,
      gender: values.gender || undefined,
      emergencyPhone: values.emergencyPhone || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
      currentAllowedCourseId:
        values.currentAllowedCourseId === "ROOT"
          ? null
          : values.currentAllowedCourseId || undefined,
      password: values.password || undefined,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("createModal.title")}</DialogTitle>
          <DialogDescription>{t("createModal.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Identity Section */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("createModal.identityTab")}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.firstName)}>
                <FieldLabel>{t("createModal.firstName")}</FieldLabel>
                <Input
                  {...register("firstName")}
                  className="h-10 rounded-xl"
                  placeholder="علی"
                />
                <FieldError>{errors.firstName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.lastName)}>
                <FieldLabel>{t("createModal.lastName")}</FieldLabel>
                <Input
                  {...register("lastName")}
                  className="h-10 rounded-xl"
                  placeholder="رضایی"
                />
                <FieldError>{errors.lastName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.phone)}>
                <FieldLabel>{t("createModal.phone")}</FieldLabel>
                <Input
                  type="tel"
                  dir="ltr"
                  {...register("phone")}
                  className="h-10 rounded-xl text-start font-mono"
                  placeholder="09123456789"
                />
                <FieldError>{errors.phone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.nationalCode)}>
                <FieldLabel>{t("createModal.nationalCode")}</FieldLabel>
                <Input
                  type="text"
                  dir="ltr"
                  {...register("nationalCode")}
                  className="h-10 rounded-xl text-start font-mono"
                  placeholder="0012345678"
                />
                <FieldError>{errors.nationalCode?.message}</FieldError>
              </Field>
            </div>
          </div>

          {/* Profile & Guardian Section */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("createModal.profileTab")}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.fatherName)}>
                <FieldLabel>{t("createModal.fatherName")}</FieldLabel>
                <Input
                  {...register("fatherName")}
                  className="h-10 rounded-xl"
                  placeholder="رضا"
                />
                <FieldError>{errors.fatherName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.emergencyPhone)}>
                <FieldLabel>{t("createModal.emergencyPhone")}</FieldLabel>
                <Input
                  type="tel"
                  dir="ltr"
                  {...register("emergencyPhone")}
                  className="h-10 rounded-xl text-start font-mono"
                  placeholder="09121112233"
                />
                <FieldError>{errors.emergencyPhone?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.gender)}>
                <FieldLabel>{t("createModal.gender")}</FieldLabel>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Combobox
                      items={genderOptions}
                      value={field.value || undefined}
                      onValueChange={(val) => field.onChange(val || "")}
                      placeholder={t("createModal.genderSelect")}
                      searchable={false}
                      data-invalid={Boolean(errors.gender)}
                    />
                  )}
                />
                <FieldError>{errors.gender?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.birthDate)}>
                <FieldLabel>{t("createModal.birthDate")}</FieldLabel>
                <Controller
                  control={control}
                  name="birthDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value || undefined}
                      onChange={(val) => field.onChange(val || "")}
                      locale={locale}
                      placeholder={t("createModal.birthDate")}
                      data-invalid={Boolean(errors.birthDate)}
                    />
                  )}
                />
                <FieldError>{errors.birthDate?.message}</FieldError>
              </Field>

              <div className="col-span-1 sm:col-span-2">
                <Field data-invalid={Boolean(errors.address)}>
                  <FieldLabel>{t("createModal.address")}</FieldLabel>
                  <Input
                    {...register("address")}
                    className="h-10 rounded-xl"
                    placeholder="تهران، خیابان ولیعصر..."
                  />
                  <FieldError>{errors.address?.message}</FieldError>
                </Field>
              </div>
            </div>
          </div>

          {/* Academic & Password Section */}
          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t("createModal.academicTab")}
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.currentAllowedCourseId)}>
                <FieldLabel>
                  {t("createModal.currentAllowedCourseId")}
                </FieldLabel>
                <Controller
                  control={control}
                  name="currentAllowedCourseId"
                  render={({ field }) => (
                    <Combobox
                      items={courseOptions}
                      value={field.value || "ROOT"}
                      onValueChange={(val) =>
                        field.onChange(val === "ROOT" ? null : val || null)
                      }
                      placeholder={t("createModal.selectCourse")}
                      clearable={false}
                      data-invalid={Boolean(errors.currentAllowedCourseId)}
                    />
                  )}
                />
                <FieldError>
                  {errors.currentAllowedCourseId?.message}
                </FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel>{t("createModal.password")}</FieldLabel>
                <PasswordInput
                  {...register("password")}
                  className="h-10 rounded-xl"
                  placeholder="••••••••"
                />
                <FieldDescription>
                  {t("createModal.passwordHint")}
                </FieldDescription>
                <FieldError>{errors.password?.message}</FieldError>
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-xl"
            >
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              <span>{t("createModal.submit")}</span>
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
