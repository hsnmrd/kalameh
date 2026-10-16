"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import {
  coursesResource,
  teachersResource,
  useUploadProgress,
  resetUploadProgress,
} from "@/lib/api"
import {
  useUpdateTeacherSchema,
  type UpdateTeacherInput,
} from "../../hooks/use-teacher-schemas"
import type { EditTeacherModalProps } from "./types"
import { FormFields } from "./form-fields"

export type { EditTeacherModalProps } from "./types"

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

  const form = useForm<UpdateTeacherInput>({
    resolver: zodResolver(updateTeacherSchema),
  })
  const {
    handleSubmit,
    reset,
    formState: { dirtyFields },
  } = form
  const { data: courses = [], isLoading: areCoursesLoading } = useQuery({
    ...coursesResource.list.toQuery(
      teacher?.instituteId ? { instituteId: teacher.instituteId } : undefined
    ),
    enabled: open && Boolean(teacher?.instituteId),
  })

  React.useEffect(() => {
    if (teacher && open) {
      reset({
        avatar: null,
        avatarUrl: teacher.avatarUrl || null,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        nationalCode: teacher.nationalCode || "",
        degree: teacher.teacherProfile?.degree || "",
        bio: teacher.teacherProfile?.bio || "",
        isActive: teacher.isActive,
        courseIds:
          teacher.teacherProfile?.teachableCourses?.map(
            (qualification) => qualification.courseId
          ) || [],
      })
    }
  }, [teacher, open, reset])

  const updateMutation = useMutation({
    ...teachersResource.update.toMutation(),
    onMutate: () => {
      resetUploadProgress("teacher-avatar")
    },
    onSettled: () => {
      resetUploadProgress("teacher-avatar")
    },
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: teachersResource.list.baseKey(),
      })
      onClose()
    },
  })

  const avatarProgress = useUploadProgress("teacher-avatar")
  const isAvatarUploading =
    updateMutation.isPending && form.getValues("avatar") instanceof File

  const onSubmit = (values: UpdateTeacherInput) => {
    if (!teacher) return

    const patchBody: Partial<UpdateTeacherInput> = {}

    if (values.avatar instanceof File) {
      patchBody.avatar = values.avatar
    } else if (
      (dirtyFields.avatarUrl && values.avatarUrl === null) ||
      (teacher.avatarUrl && values.avatarUrl === null)
    ) {
      patchBody.avatarUrl = null
    }

    if (dirtyFields.firstName) patchBody.firstName = values.firstName?.trim()
    if (dirtyFields.lastName) patchBody.lastName = values.lastName?.trim()
    if (dirtyFields.phone) patchBody.phone = values.phone?.trim()
    if (dirtyFields.nationalCode)
      patchBody.nationalCode = values.nationalCode?.trim() || null
    if (dirtyFields.degree) patchBody.degree = values.degree?.trim() || null
    if (dirtyFields.bio) patchBody.bio = values.bio?.trim() || null
    if (dirtyFields.isActive) patchBody.isActive = values.isActive

    const initialCourseIds = (
      teacher.teacherProfile?.teachableCourses?.map((q) => q.courseId) || []
    )
      .slice()
      .sort()
    const currentCourseIds = (values.courseIds || []).slice().sort()
    const areCoursesEqual =
      initialCourseIds.length === currentCourseIds.length &&
      initialCourseIds.every((id, idx) => id === currentCourseIds[idx])

    if (!areCoursesEqual) {
      patchBody.courseIds = JSON.stringify(
        values.courseIds ?? []
      ) as unknown as string[]
    }

    if (Object.keys(patchBody).length === 0) {
      onClose()
      return
    }

    updateMutation.mutate({
      id: teacher.id,
      body: patchBody,
      progressKey: "teacher-avatar",
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
            <FormFields
              form={form}
              courses={courses}
              areCoursesLoading={areCoursesLoading}
              statusOptions={statusOptions}
              uploadProgress={isAvatarUploading ? avatarProgress : undefined}
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
