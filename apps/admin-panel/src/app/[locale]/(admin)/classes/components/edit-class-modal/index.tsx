"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Combobox } from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import type { ClassDto } from "@workspace/types"
import {
  classesResource,
  termsResource,
  coursesResource,
  branchesResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useUpdateClassSchema,
  type UpdateClassInput,
} from "../../hooks/use-class-schemas"

export interface EditClassModalProps {
  cls: ClassDto | null
  open: boolean
  onClose: () => void
}

export function EditClassModal({ cls, open, onClose }: EditClassModalProps) {
  const t = useTranslations("classes")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const updateClassSchema = useUpdateClassSchema()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: termOptions = [] } = useQuery({
    ...termsResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (terms) => terms.map((tm) => ({ value: tm.id, label: tm.title })),
  })

  const { data: courseOptions = [] } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (courses) => courses.map((c) => ({ value: c.id, label: c.title })),
  })

  const { data: branchOptions = [] } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (branches) => branches.map((b) => ({ value: b.id, label: b.name })),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateClassInput>({
    resolver: zodResolver(updateClassSchema),
    defaultValues: {
      title: "",
      termId: "",
      courseId: "",
      branchId: null,
      capacity: 15,
      fee: 0,
      teacherName: "",
      schedule: "",
    },
  })

  React.useEffect(() => {
    if (cls) {
      reset({
        title: cls.title,
        termId: cls.termId,
        courseId: cls.courseId,
        branchId: cls.branchId || null,
        capacity: cls.capacity,
        fee: cls.fee,
        teacherName: cls.teacherName || "",
        schedule: cls.schedule || "",
      })
    }
  }, [cls, reset])

  const updateMutation = useMutation({
    ...classesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: classesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: UpdateClassInput) => {
    if (!cls) return
    updateMutation.mutate({
      id: cls.id,
      body: values,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("editModal.title")}</DialogTitle>
          <DialogDescription>{t("editModal.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel>{t("editModal.classTitle")}</FieldLabel>
            <Input
              {...register("title")}
              placeholder={t("editModal.titlePlaceholder")}
              className="h-10 rounded-xl"
            />
            <FieldError>{errors.title?.message}</FieldError>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.termId)}>
              <FieldLabel>{t("editModal.term")}</FieldLabel>
              <Controller
                control={control}
                name="termId"
                render={({ field }) => (
                  <Combobox
                    items={termOptions}
                    value={field.value || ""}
                    onValueChange={(val) => field.onChange(val || "")}
                    placeholder={t("editModal.term")}
                    className="w-full"
                  />
                )}
              />
              <FieldError>{errors.termId?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.courseId)}>
              <FieldLabel>{t("editModal.course")}</FieldLabel>
              <Controller
                control={control}
                name="courseId"
                render={({ field }) => (
                  <Combobox
                    items={courseOptions}
                    value={field.value || ""}
                    onValueChange={(val) => field.onChange(val || "")}
                    placeholder={t("editModal.course")}
                    className="w-full"
                  />
                )}
              />
              <FieldError>{errors.courseId?.message}</FieldError>
            </Field>
          </div>

          {/* Branch (Optional) */}
          <Field data-invalid={Boolean(errors.branchId)}>
            <FieldLabel>{t("editModal.branch")}</FieldLabel>
            <Controller
              control={control}
              name="branchId"
              render={({ field }) => (
                <Combobox
                  items={branchOptions}
                  value={field.value || ""}
                  onValueChange={(val) => field.onChange(val || null)}
                  placeholder={t("editModal.branchPlaceholder")}
                  className="w-full"
                />
              )}
            />
            <FieldError>{errors.branchId?.message}</FieldError>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.capacity)}>
              <FieldLabel>{t("editModal.capacity")}</FieldLabel>
              <Input
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                className="h-10 rounded-xl font-mono"
              />
              <FieldError>{errors.capacity?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.fee)}>
              <FieldLabel>{t("editModal.fee")}</FieldLabel>
              <Input
                type="number"
                {...register("fee", { valueAsNumber: true })}
                className="h-10 rounded-xl font-mono"
              />
              <FieldError>{errors.fee?.message}</FieldError>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.teacherName)}>
              <FieldLabel>{t("editModal.teacherName")}</FieldLabel>
              <Input {...register("teacherName")} className="h-10 rounded-xl" />
              <FieldError>{errors.teacherName?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.schedule)}>
              <FieldLabel>{t("editModal.schedule")}</FieldLabel>
              <Input {...register("schedule")} className="h-10 rounded-xl" />
              <FieldError>{errors.schedule?.message}</FieldError>
            </Field>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-xl px-4"
            >
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-10 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              {t("editModal.submit")}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
