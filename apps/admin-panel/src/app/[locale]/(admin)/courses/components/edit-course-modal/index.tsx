"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import type { CourseDto } from "@workspace/types"
import { coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useUpdateCourseSchema,
  type UpdateCourseInput,
} from "../../hooks/use-course-schemas"

export interface EditCourseModalProps {
  course: CourseDto | null
  open: boolean
  onClose: () => void
}

export function EditCourseModal({
  course,
  open,
  onClose,
}: EditCourseModalProps) {
  const t = useTranslations("courses")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const updateCourseSchema = useUpdateCourseSchema()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  // Exclude current course from its own prerequisite options
  const {
    data: prerequisiteOptions = [
      { value: "none", label: t("createModal.none") },
    ],
  } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (courses) => [
      { value: "none", label: t("createModal.none") },
      ...courses
        .filter((c) => c.id !== course?.id)
        .map((c) => ({ value: c.id, label: c.title })),
    ],
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateCourseInput>({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      title: "",
      baseFee: 0,
      prerequisiteId: null,
    },
  })

  React.useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        baseFee: course.baseFee,
        prerequisiteId: course.prerequisiteId || null,
      })
    }
  }, [course, reset])

  const updateMutation = useMutation({
    ...coursesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: coursesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: UpdateCourseInput) => {
    if (!course) return
    updateMutation.mutate({
      id: course.id,
      body: {
        ...values,
        prerequisiteId:
          values.prerequisiteId === "none" || !values.prerequisiteId
            ? null
            : values.prerequisiteId,
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
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel>{t("editModal.courseTitle")}</FieldLabel>
              <Input {...register("title")} />
              <FieldError>{errors.title?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.baseFee)}>
              <FieldLabel>{t("editModal.baseFee")}</FieldLabel>
              <Input
                type="number"
                {...register("baseFee", { valueAsNumber: true })}
                className="font-mono"
              />
              <FieldError>{errors.baseFee?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>{t("editModal.prerequisite")}</FieldLabel>
              <Controller
                control={control}
                name="prerequisiteId"
                render={({ field }) => (
                  <ResponsiveCombobox
                    items={prerequisiteOptions}
                    value={field.value || "none"}
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? null : val)
                    }
                    placeholder={t("createModal.none")}
                    drawerTitle={t("editModal.prerequisite")}
                    className="w-full"
                  />
                )}
              />
            </Field>
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
