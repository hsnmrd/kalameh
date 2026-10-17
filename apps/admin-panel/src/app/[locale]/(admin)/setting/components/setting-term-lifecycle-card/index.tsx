"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "@workspace/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { institutesResource, termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

interface FormValues {
  termRegistrationDaysBeforeStart: number
  termRegistrationDaysAfterStart: number
  termExamDaysBeforeEnd: number
}

export function SettingTermLifecycleCard() {
  const t = useTranslations("setting")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const { data: institute, isLoading } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const schema = React.useMemo(
    () =>
      z.object({
        termRegistrationDaysBeforeStart: z.coerce.number().int().min(0).max(90),
        termRegistrationDaysAfterStart: z.coerce.number().int().min(0).max(90),
        termExamDaysBeforeEnd: z.coerce.number().int().min(0).max(30),
      }),
    []
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
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
      toast.success(t("termLifecycle.success"))
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
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xs">
      <div className="flex flex-col gap-1">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <CalendarClock className="size-4 text-primary" />
          <span>{t("termLifecycle.title")}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("termLifecycle.description")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-36 items-center justify-center">
          <Spinner className="size-6 text-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel>{t("termLifecycle.regDaysBeforeLabel")}</FieldLabel>
              <Input
                type="number"
                min={0}
                max={90}
                placeholder="10"
                className="h-14 rounded-2xl text-base"
                {...register("termRegistrationDaysBeforeStart")}
              />
              <span className="text-[11px] text-muted-foreground">
                {t("termLifecycle.regDaysBeforeHint")}
              </span>
              {errors.termRegistrationDaysBeforeStart && (
                <FieldError>
                  {errors.termRegistrationDaysBeforeStart.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>{t("termLifecycle.regDaysAfterLabel")}</FieldLabel>
              <Input
                type="number"
                min={0}
                max={90}
                placeholder="7"
                className="h-14 rounded-2xl text-base"
                {...register("termRegistrationDaysAfterStart")}
              />
              <span className="text-[11px] text-muted-foreground">
                {t("termLifecycle.regDaysAfterHint")}
              </span>
              {errors.termRegistrationDaysAfterStart && (
                <FieldError>
                  {errors.termRegistrationDaysAfterStart.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>{t("termLifecycle.examDaysBeforeLabel")}</FieldLabel>
              <Input
                type="number"
                min={0}
                max={30}
                placeholder="2"
                className="h-14 rounded-2xl text-base"
                {...register("termExamDaysBeforeEnd")}
              />
              <span className="text-[11px] text-muted-foreground">
                {t("termLifecycle.examDaysBeforeHint")}
              </span>
              {errors.termExamDaysBeforeEnd && (
                <FieldError>{errors.termExamDaysBeforeEnd.message}</FieldError>
              )}
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                updateMutation.isPending ||
                (!isDirty && Boolean(institute))
              }
              className="h-14 rounded-2xl px-6 text-base"
            >
              {isSubmitting || updateMutation.isPending ? (
                <Spinner className="me-2 size-4" />
              ) : null}
              {t("termLifecycle.save")}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
