"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { type ComboboxOption } from "@workspace/ui/components/combobox"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import type { StudentDto, SupportedLocale } from "@workspace/types"
import { coursesResource, studentsResource } from "@/lib/api"
import {
  type UpdateStudentInput,
  useUpdateStudentSchema,
} from "../../hooks/use-student-schemas"
import { FormFields } from "./form-fields"

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
  const locale = useLocale() as SupportedLocale
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
      ...courses.map((course) => ({ value: course.id, label: course.title })),
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

  const form = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
  })
  const { handleSubmit, reset } = form

  React.useEffect(() => {
    if (!student) return
    const birthDate = student.studentProfile?.birthDate
      ? new Date(student.studentProfile.birthDate).toISOString().split("T")[0]
      : ""
    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone,
      nationalCode: student.nationalCode || "",
      avatar: null,
      avatarUrl: student.avatarUrl || null,
      fatherName: student.studentProfile?.fatherName || "",
      birthDate: birthDate || "",
      gender: student.studentProfile?.gender || "",
      emergencyPhone: student.studentProfile?.emergencyPhone || "",
      address: student.studentProfile?.address || "",
      currentAllowedCourseId: student.currentAllowedCourseId || null,
      isActive: student.isActive,
    })
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
        avatar: values.avatar || undefined,
        nationalCode: values.nationalCode || null,
        fatherName: values.fatherName || null,
        birthDate: values.birthDate || null,
        gender: values.gender || null,
        emergencyPhone: values.emergencyPhone || null,
        address: values.address || null,
        currentAllowedCourseId:
          values.currentAllowedCourseId === "ROOT"
            ? null
            : values.currentAllowedCourseId || null,
      },
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <FormFields
              form={form}
              locale={locale}
              genderOptions={genderOptions}
              courseOptions={courseOptions}
              statusOptions={statusOptions}
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
              <span>{t("editModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
