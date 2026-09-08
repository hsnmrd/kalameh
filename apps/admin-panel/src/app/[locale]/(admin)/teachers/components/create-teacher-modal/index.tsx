"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { coursesResource, teachersResource } from "@/lib/api"
import {
  type CreateTeacherInput,
  useCreateTeacherSchema,
} from "../../hooks/use-teacher-schemas"
import { FormFields } from "./form-fields"

export interface CreateTeacherModalProps {
  open: boolean
  onClose: () => void
  instituteId?: string
}

export function CreateTeacherModal({
  open,
  onClose,
  instituteId,
}: CreateTeacherModalProps) {
  const t = useTranslations("teachers")
  const queryClient = useQueryClient()
  const schema = useCreateTeacherSchema()
  const defaults = React.useMemo(
    () => ({
      firstName: "",
      lastName: "",
      phone: "",
      nationalCode: "",
      password: "",
      degree: "",
      bio: "",
      availabilities: [],
      courseIds: [],
      instituteId,
    }),
    [instituteId]
  )
  const form = useForm<CreateTeacherInput>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })
  const { handleSubmit, reset } = form
  const { data: courses = [], isLoading: areCoursesLoading } = useQuery({
    ...coursesResource.list.toQuery(instituteId ? { instituteId } : undefined),
    enabled: open,
  })

  React.useEffect(() => {
    if (open) reset(defaults)
  }, [open, reset, defaults])
  const createMutation = useMutation({
    ...teachersResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: teachersResource.list.baseKey(),
      })
      onClose()
    },
  })
  const onSubmit = (data: CreateTeacherInput) => {
    const body = new FormData()
    body.append("firstName", data.firstName)
    body.append("lastName", data.lastName)
    body.append("phone", data.phone)
    if (data.nationalCode) body.append("nationalCode", data.nationalCode)
    if (data.password) body.append("password", data.password)
    if (data.degree) body.append("degree", data.degree)
    if (data.bio) body.append("bio", data.bio)
    if (instituteId) body.append("instituteId", instituteId)
    body.append("courseIds", JSON.stringify(data.courseIds ?? []))
    data.availabilities?.forEach((slot, index) => {
      body.append(`availabilities[${index}][dayOfWeek]`, slot.dayOfWeek)
      body.append(`availabilities[${index}][startTime]`, slot.startTime)
      body.append(`availabilities[${index}][endTime]`, slot.endTime)
    })
    createMutation.mutate(body as never)
  }

  return (
    <FormDialog open={open} onOpenChange={(value) => !value && onClose()}>
      <FormDialogContent className="sm:max-w-xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
          data-form-type="other"
          className="flex min-h-0 flex-1 flex-col justify-between gap-4 overflow-hidden"
        >
          <div
            className="pointer-events-none sr-only absolute -top-96 -left-96"
            aria-hidden="true"
          >
            <Input
              type="text"
              name="prevent_autofill_username"
              tabIndex={-1}
              autoComplete="username"
              readOnly
            />
            <Input
              type="password"
              name="prevent_autofill_password"
              tabIndex={-1}
              autoComplete="current-password"
              readOnly
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            <FormFields
              form={form}
              courses={courses}
              areCoursesLoading={areCoursesLoading}
            />
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
