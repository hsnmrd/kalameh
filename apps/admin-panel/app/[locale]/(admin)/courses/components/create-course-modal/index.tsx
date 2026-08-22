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
import { coursesResource } from "@/lib/api"
import {
  useCreateCourseSchema,
  type CreateCourseInput,
} from "../../hooks/use-course-schemas"

export interface CreateCourseModalProps {
  open: boolean
  onClose: () => void
}

export function CreateCourseModal({ open, onClose }: CreateCourseModalProps) {
  const t = useTranslations("courses")
  const queryClient = useQueryClient()
  const createCourseSchema = useCreateCourseSchema()

  const { data: existingCourses } = useQuery(coursesResource.list.toQuery())

  const prerequisiteOptions: ComboboxOption[] = React.useMemo(() => {
    const list: ComboboxOption[] = [
      { value: "none", label: t("createModal.none") },
    ]
    if (existingCourses) {
      existingCourses.forEach((c) => {
        list.push({ value: c.id, label: c.title })
      })
    }
    return list
  }, [existingCourses, t])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      baseFee: 1500000,
      prerequisiteId: null,
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({
        title: "",
        baseFee: 1500000,
        prerequisiteId: null,
      })
    }
  }, [open, reset])

  const createMutation = useMutation({
    ...coursesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: coursesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: CreateCourseInput) => {
    createMutation.mutate({
      ...values,
      prerequisiteId:
        values.prerequisiteId === "none" || !values.prerequisiteId
          ? null
          : values.prerequisiteId,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("createModal.title")}</DialogTitle>
          <DialogDescription>{t("createModal.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel>{t("createModal.courseTitle")}</FieldLabel>
            <Input
              {...register("title")}
              placeholder="Top Notch 1A"
              className="h-10 rounded-xl"
            />
            <FieldError>{errors.title?.message}</FieldError>
          </Field>

          <Field data-invalid={Boolean(errors.baseFee)}>
            <FieldLabel>{t("createModal.baseFee")}</FieldLabel>
            <Input
              type="number"
              {...register("baseFee", { valueAsNumber: true })}
              className="h-10 rounded-xl font-mono"
            />
            <FieldError>{errors.baseFee?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>{t("createModal.prerequisite")}</FieldLabel>
            <Controller
              control={control}
              name="prerequisiteId"
              render={({ field }) => (
                <Combobox
                  items={prerequisiteOptions}
                  value={field.value || "none"}
                  onValueChange={(val) =>
                    field.onChange(val === "none" ? null : val)
                  }
                  placeholder={t("createModal.none")}
                  className="w-full"
                />
              )}
            />
          </Field>

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
              className="h-10 rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800"
            >
              {createMutation.isPending && <Spinner className="me-2 size-4" />}
              {t("createModal.submit")}
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
