"use client"

import * as React from "react"
import { CheckCircle2, UserPlus } from "lucide-react"
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
import { PasswordInput } from "@workspace/ui/components/password-input"
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
import { coursesResource, studentsResource } from "@/lib/api"
import {
  useCreateStudentSchema,
  type CreateStudentInput,
} from "../../hooks/use-student-schemas"
import { useStudentLookup } from "../../hooks/use-student-lookup"

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
  const { data: courses = [] } = useQuery({
    ...coursesResource.list.toQuery(instituteId ? { instituteId } : undefined),
    enabled: open && !!instituteId,
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

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
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

  // Live Lookup Logic
  const { lookupData, isLookingUp, shouldQuery, resetLookup } =
    useStudentLookup({
      open,
      watch,
      setValue,
    })

  const createMutation = useMutation({
    ...studentsResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: studentsResource.list.baseKey(),
      })
      resetLookup()
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
      resetLookup()
      reset()
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-6 sm:px-0 sm:py-0">
            {/* Identity Section */}
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {t("createModal.identityTab")}
                </h4>
                {isLookingUp && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <Spinner className="size-3 text-muted-foreground" />
                    <span>{t("createModal.lookupChecking")}</span>
                  </div>
                )}
                {lookupData?.found && !isLookingUp && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                    <span>{t("createModal.lookupFound")}</span>
                  </div>
                )}
                {shouldQuery &&
                  !isLookingUp &&
                  lookupData &&
                  !lookupData.found && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      <UserPlus className="size-3.5 shrink-0 text-muted-foreground" />
                      <span>{t("createModal.lookupNew")}</span>
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* 1. National Code */}
                <Field data-invalid={Boolean(errors.nationalCode)}>
                  <FieldLabel>{t("createModal.nationalCode")}</FieldLabel>
                  <Input
                    dir="ltr"
                    {...register("nationalCode")}
                    className="text-start font-mono"
                    placeholder={t("createModal.nationalCodePlaceholder")}
                  />
                  <FieldDescription>
                    {t("createModal.nationalCodeHint")}
                  </FieldDescription>
                  <FieldError>{errors.nationalCode?.message}</FieldError>
                </Field>

                {/* 2. Phone Number */}
                <Field data-invalid={Boolean(errors.phone)}>
                  <FieldLabel>{t("createModal.phone")}</FieldLabel>
                  <Input
                    type="tel"
                    dir="ltr"
                    {...register("phone")}
                    className="text-start font-mono"
                    placeholder={t("createModal.phonePlaceholder")}
                  />
                  <FieldError>{errors.phone?.message}</FieldError>
                </Field>

                {/* 3. First Name */}
                <Field data-invalid={Boolean(errors.firstName)}>
                  <FieldLabel>{t("createModal.firstName")}</FieldLabel>
                  <Input
                    {...register("firstName")}
                    placeholder={t("createModal.firstNamePlaceholder")}
                  />
                  <FieldError>{errors.firstName?.message}</FieldError>
                </Field>

                {/* 4. Last Name */}
                <Field data-invalid={Boolean(errors.lastName)}>
                  <FieldLabel>{t("createModal.lastName")}</FieldLabel>
                  <Input
                    {...register("lastName")}
                    placeholder={t("createModal.lastNamePlaceholder")}
                  />
                  <FieldError>{errors.lastName?.message}</FieldError>
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
                    placeholder={t("createModal.fatherNamePlaceholder")}
                  />
                  <FieldError>{errors.fatherName?.message}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.emergencyPhone)}>
                  <FieldLabel>{t("createModal.emergencyPhone")}</FieldLabel>
                  <Input
                    type="tel"
                    dir="ltr"
                    {...register("emergencyPhone")}
                    className="text-start font-mono"
                    placeholder={t("createModal.emergencyPhonePlaceholder")}
                  />
                  <FieldError>{errors.emergencyPhone?.message}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.gender)}>
                  <FieldLabel>{t("createModal.gender")}</FieldLabel>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <ResponsiveCombobox
                        items={genderOptions}
                        value={field.value || undefined}
                        onValueChange={(val) => field.onChange(val || "")}
                        placeholder={t("createModal.genderSelect")}
                        drawerTitle={t("createModal.gender")}
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
                    <FieldLabel>{t("createModal.address")}</FieldLabel>
                    <Input
                      {...register("address")}
                      placeholder={t("createModal.addressPlaceholder")}
                    />
                    <FieldError>{errors.address?.message}</FieldError>
                  </Field>
                </div>
              </div>
            </div>

            {/* Academic & Auth Section */}
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
                      <ResponsiveCombobox
                        items={courseOptions}
                        value={field.value || "ROOT"}
                        onValueChange={(val) =>
                          field.onChange(val === "ROOT" ? null : val || null)
                        }
                        placeholder={t("createModal.selectCourse")}
                        drawerTitle={t("createModal.currentAllowedCourseId")}
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
                    placeholder={t("createModal.passwordPlaceholder")}
                  />
                  <FieldDescription>
                    {t("createModal.passwordHint")}
                  </FieldDescription>
                  <FieldError>{errors.password?.message}</FieldError>
                </Field>
              </div>
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
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
