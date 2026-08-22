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
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { classesResource, termsResource, coursesResource } from "@/lib/api"
import {
  useCreateClassSchema,
  type CreateClassInput,
} from "../../hooks/use-class-schemas"

export interface CreateClassModalProps {
  open: boolean
  onClose: () => void
}

export function CreateClassModal({ open, onClose }: CreateClassModalProps) {
  const t = useTranslations("classes")
  const queryClient = useQueryClient()
  const createClassSchema = useCreateClassSchema()

  const { data: terms } = useQuery(termsResource.list.toQuery())
  const { data: courses } = useQuery(coursesResource.list.toQuery())

  const { data: termOptions = [] } = useQuery({
    ...termsResource.list.toQuery(),
    select: (list) => list.map((tm) => ({ value: tm.id, label: tm.title })),
  })

  const { data: courseOptions = [] } = useQuery({
    ...coursesResource.list.toQuery(),
    select: (list) => list.map((c) => ({ value: c.id, label: c.title })),
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      title: "",
      termId: "",
      courseId: "",
      capacity: 15,
      fee: 1500000,
      teacherName: "",
      schedule: "",
    },
  })

  // When course changes, update default fee to course.baseFee
  const selectedCourseId = watch("courseId")
  React.useEffect(() => {
    if (selectedCourseId && courses) {
      const selected = courses.find((c) => c.id === selectedCourseId)
      if (selected) {
        setValue("fee", selected.baseFee)
      }
    }
  }, [selectedCourseId, courses, setValue])

  React.useEffect(() => {
    if (open) {
      reset({
        title: "",
        termId: terms?.[0]?.id || "",
        courseId: courses?.[0]?.id || "",
        capacity: 15,
        fee: courses?.[0]?.baseFee || 1500000,
        teacherName: "",
        schedule: "",
      })
    }
  }, [open, terms, courses, reset])

  const createMutation = useMutation({
    ...classesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: classesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: CreateClassInput) => {
    createMutation.mutate(values)
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
          <DialogTitle>{t("createModal.title")}</DialogTitle>
          <DialogDescription>{t("createModal.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel>{t("createModal.classTitle")}</FieldLabel>
            <Input
              {...register("title")}
              placeholder="گروه A"
              className="h-10 rounded-xl"
            />
            <FieldError>{errors.title?.message}</FieldError>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.termId)}>
              <FieldLabel>{t("createModal.term")}</FieldLabel>
              <Controller
                control={control}
                name="termId"
                render={({ field }) => (
                  <Combobox
                    items={termOptions}
                    value={field.value}
                    onValueChange={(val) => field.onChange(val || "")}
                    placeholder={t("createModal.term")}
                    className="w-full"
                  />
                )}
              />
              <FieldError>{errors.termId?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.courseId)}>
              <FieldLabel>{t("createModal.course")}</FieldLabel>
              <Controller
                control={control}
                name="courseId"
                render={({ field }) => (
                  <Combobox
                    items={courseOptions}
                    value={field.value}
                    onValueChange={(val) => field.onChange(val || "")}
                    placeholder={t("createModal.course")}
                    className="w-full"
                  />
                )}
              />
              <FieldError>{errors.courseId?.message}</FieldError>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.capacity)}>
              <FieldLabel>{t("createModal.capacity")}</FieldLabel>
              <Input
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                className="h-10 rounded-xl font-mono"
              />
              <FieldError>{errors.capacity?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.fee)}>
              <FieldLabel>{t("createModal.fee")}</FieldLabel>
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
              <FieldLabel>{t("createModal.teacherName")}</FieldLabel>
              <Input
                {...register("teacherName")}
                placeholder="دکتر محمدی"
                className="h-10 rounded-xl"
              />
              <FieldError>{errors.teacherName?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.schedule)}>
              <FieldLabel>{t("createModal.schedule")}</FieldLabel>
              <Input
                {...register("schedule")}
                placeholder="زوج ۱۷:۰۰ تا ۱۸:۳۰"
                className="h-10 rounded-xl"
              />
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
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              {t("createModal.submit")}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
