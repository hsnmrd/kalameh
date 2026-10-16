"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "@workspace/types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import type { InstituteWithStats } from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { FinancialPreviewCard } from "../financial-preview-card"

export interface FinancialSettingsFormProps {
  institute: InstituteWithStats
}

interface FormValues {
  bankAccountName: string
  bankCardNumber: string
  bankShaba: string
}

export function FinancialSettingsForm({
  institute,
}: FinancialSettingsFormProps) {
  const t = useTranslations("transactions.settings")
  const queryClient = useQueryClient()
  const { setActiveInstitute } = useActiveInstitute()

  const schema = React.useMemo(
    () =>
      z.object({
        bankAccountName: z.string().trim().max(100),
        bankCardNumber: z
          .string()
          .trim()
          .refine(
            (val) => {
              const digits = val.replace(/\s+/g, "")
              return digits.length === 0 || /^\d{16}$/.test(digits)
            },
            { message: t("bankCardNumberPlaceholder") }
          ),
        bankShaba: z
          .string()
          .trim()
          .refine(
            (val) => {
              const clean = val.replace(/\s+/g, "").toUpperCase()
              return clean.length === 0 || /^(IR)?\d{24}$/.test(clean)
            },
            { message: t("bankShabaPlaceholder") }
          ),
      }),
    [t]
  )

  const defaultValues: FormValues = React.useMemo(
    () => ({
      bankAccountName: institute.bankAccountName || "",
      bankCardNumber: institute.bankCardNumber || "",
      bankShaba: institute.bankShaba || "",
    }),
    [institute]
  )

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    values: defaultValues,
  })

  const watchedValues = watch()

  const updateMutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: (updated) => {
      toast.success(t("saveSuccess"))
      void queryClient.invalidateQueries({
        queryKey: institutesResource.detail.baseKey(),
      })
      setActiveInstitute(updated)
      reset({
        bankAccountName: updated.bankAccountName || "",
        bankCardNumber: updated.bankCardNumber || "",
        bankShaba: updated.bankShaba || "",
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    const cleanCard = data.bankCardNumber.replace(/\s+/g, "") || null
    let cleanShaba = data.bankShaba.replace(/\s+/g, "").toUpperCase() || null
    if (cleanShaba && !cleanShaba.startsWith("IR")) {
      cleanShaba = `IR${cleanShaba}`
    }

    updateMutation.mutate({
      id: institute.id,
      body: {
        bankAccountName: data.bankAccountName.trim() || null,
        bankCardNumber: cleanCard,
        bankShaba: cleanShaba,
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Form Section */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 lg:col-span-7"
      >
        <Field data-invalid={Boolean(errors.bankAccountName)}>
          <FieldLabel>{t("bankAccountName")}</FieldLabel>
          <Input
            {...register("bankAccountName")}
            placeholder={t("bankAccountNamePlaceholder")}
          />
          <FieldError>{errors.bankAccountName?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.bankCardNumber)}>
          <FieldLabel>{t("bankCardNumber")}</FieldLabel>
          <Input
            {...register("bankCardNumber")}
            placeholder={t("bankCardNumberPlaceholder")}
            dir="ltr"
            className="font-mono text-base"
          />
          <FieldError>{errors.bankCardNumber?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.bankShaba)}>
          <FieldLabel>{t("bankShaba")}</FieldLabel>
          <Input
            {...register("bankShaba")}
            placeholder={t("bankShabaPlaceholder")}
            dir="ltr"
            className="font-mono text-base"
          />
          <FieldError>{errors.bankShaba?.message}</FieldError>
        </Field>

        <div className="mt-2 flex items-center justify-end border-t border-border/60 pt-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="min-w-32"
          >
            {updateMutation.isPending ? (
              <Spinner className="size-4" />
            ) : (
              t("save")
            )}
          </Button>
        </div>
      </form>

      {/* Live Preview Section */}
      <div className="lg:col-span-5">
        <FinancialPreviewCard
          bankAccountName={watchedValues.bankAccountName}
          bankCardNumber={watchedValues.bankCardNumber}
          bankShaba={watchedValues.bankShaba}
        />
      </div>
    </div>
  )
}
