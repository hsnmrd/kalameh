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
import { coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
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
  const { activeInstituteId } = useActiveInstitute()
  const createCourseSchema = useCreateCourseSchema()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const {
    data: prerequisiteOptions = [
      { value: "none", label: t("createModal.none") },
    ],
  } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (courses) => [
      { value: "none", label: t("createModal.none") },
      ...courses.map((c) => ({ value: c.id, label: c.title })),
    ],
  })

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
      instituteId: activeInstituteId || undefined,
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
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel>{t("createModal.courseTitle")}</FieldLabel>
              <Input
                {...register("title")}
                placeholder={t("createModal.titlePlaceholder")}
              />
              <FieldError>{errors.title?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.baseFee)}>
              <FieldLabel>{t("createModal.baseFee")}</FieldLabel>
              <Input
                type="number"
                {...register("baseFee", { valueAsNumber: true })}
                className="font-mono"
              />
              <FieldError>{errors.baseFee?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>{t("createModal.prerequisite")}</FieldLabel>
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
                    drawerTitle={t("createModal.prerequisite")}
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
              {t("createModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
