"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm } from "react-hook-form"
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
import { type ComboboxOption } from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { coursesResource, studentsResource } from "@/lib/api"
import type { SupportedLocale } from "@workspace/types"
import {
  useCreateStudentSchema,
  type CreateStudentInput,
} from "../../hooks/use-student-schemas"
import { useStudentLookup } from "../../hooks/use-student-lookup"
import { IdentityFields } from "./identity-fields"
import { ProfileFields } from "./profile-fields"

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
  const locale = useLocale() as SupportedLocale
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

  const form = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      avatar: null,
      avatarUrl: null,
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

  const { handleSubmit, reset, watch, setValue } = form

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
      avatar: values.avatar || undefined,
      avatarUrl: values.avatarUrl || undefined,
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
          autoComplete="off"
          data-form-type="other"
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <IdentityFields
              form={form}
              isLookingUp={isLookingUp}
              lookupData={lookupData}
              shouldQuery={shouldQuery}
            />
            <ProfileFields
              form={form}
              locale={locale}
              genderOptions={genderOptions}
              courseOptions={courseOptions}
            />
          </div>

          {/* Actions */}
          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
              <span>{t("createModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
