"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "@workspace/types"
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
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { institutesResource, termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface TermSettingsModalProps {
  open: boolean
  onClose: () => void
}

interface FormValues {
  termRegistrationDaysBeforeStart: number
  termRegistrationDaysAfterStart: number
  termExamDaysBeforeEnd: number
}

export function TermSettingsModal({ open, onClose }: TermSettingsModalProps) {
  const t = useTranslations("terms")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const { data: institute, isLoading: isInstituteLoading } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(open && activeInstituteId),
  })

  const schema = React.useMemo(
    () =>
      z.object({
        termRegistrationDaysBeforeStart: z.coerce
          .number()
          .int()
          .min(0, t("validation.titleMin"))
          .max(90),
        termRegistrationDaysAfterStart: z.coerce
          .number()
          .int()
          .min(0, t("validation.titleMin"))
          .max(90),
        termExamDaysBeforeEnd: z.coerce
          .number()
          .int()
          .min(0, t("validation.titleMin"))
          .max(30),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: institute
      ? {
          termRegistrationDaysBeforeStart:
            institute.termRegistrationDaysBeforeStart ?? 10,
          termRegistrationDaysAfterStart:
            institute.termRegistrationDaysAfterStart ?? 7,
          termExamDaysBeforeEnd: institute.termExamDaysBeforeEnd ?? 2,
        }
      : undefined,
  })

  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const updateMutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: institutesResource.detail.baseKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: institutesResource.list.baseKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: termsResource.list.baseKey(),
        }),
      ])
      toast.success(t("settingsModal.success"))
      onClose()
    },
  })

  const onSubmit = (values: FormValues) => {
    if (!activeInstituteId) return
    updateMutation.mutate({
      id: activeInstituteId,
      body: values,
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("settingsModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        {isInstituteLoading ? (
          <div className="flex h-56 items-center justify-center">
            <Spinner className="size-6 text-foreground" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col justify-between"
          >
            <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <p className="text-xs text-muted-foreground">
                {t("settingsModal.description")}
              </p>

              <Field>
                <FieldLabel>{t("settingsModal.regDaysBeforeLabel")}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  placeholder="10"
                  className="h-14 rounded-2xl text-base"
                  {...register("termRegistrationDaysBeforeStart")}
                />
                <span className="text-[11px] text-muted-foreground">
                  {t("settingsModal.regDaysBeforeHint")}
                </span>
                {errors.termRegistrationDaysBeforeStart && (
                  <FieldError>
                    {errors.termRegistrationDaysBeforeStart.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>{t("settingsModal.regDaysAfterLabel")}</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  placeholder="7"
                  className="h-14 rounded-2xl text-base"
                  {...register("termRegistrationDaysAfterStart")}
                />
                <span className="text-[11px] text-muted-foreground">
                  {t("settingsModal.regDaysAfterHint")}
                </span>
                {errors.termRegistrationDaysAfterStart && (
                  <FieldError>
                    {errors.termRegistrationDaysAfterStart.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>
                  {t("settingsModal.examDaysBeforeLabel")}
                </FieldLabel>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  placeholder="2"
                  className="h-14 rounded-2xl text-base"
                  {...register("termExamDaysBeforeEnd")}
                />
                <span className="text-[11px] text-muted-foreground">
                  {t("settingsModal.examDaysBeforeHint")}
                </span>
                {errors.termExamDaysBeforeEnd && (
                  <FieldError>
                    {errors.termExamDaysBeforeEnd.message}
                  </FieldError>
                )}
              </Field>
            </div>

            <FormDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || updateMutation.isPending}
                className="h-14 rounded-2xl px-6 text-base"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
                className="h-14 rounded-2xl px-6 text-base"
              >
                {isSubmitting || updateMutation.isPending ? (
                  <Spinner className="me-2 size-4" />
                ) : null}
                {t("settingsModal.submit")}
              </Button>
            </FormDialogFooter>
          </form>
        )}
      </FormDialogContent>
    </FormDialog>
  )
}
