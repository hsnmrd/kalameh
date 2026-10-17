"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { hasInstituteFinanceInfo, z } from "@workspace/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import type { InstituteWithStats } from "@workspace/types"
import { institutesResource, termsResource } from "@/lib/api"
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const { data: terms } = useQuery({
    ...termsResource.list.toQuery({ isActive: true }),
    enabled: Boolean(institute.id),
  })

  const isRegistrationActive = React.useMemo(() => {
    if (institute.hasActiveRegistrationTerm) return true
    if (!terms || terms.length === 0) return false
    return terms.some(
      (term) =>
        term.lifecycleStatuses?.includes("REGISTERING") ||
        term.lifecycleStatus === "REGISTERING"
    )
  }, [institute.hasActiveRegistrationTerm, terms])

  const hasConfiguredFinanceInfo = React.useMemo(
    () => hasInstituteFinanceInfo(institute),
    [institute]
  )

  const isLocked = isRegistrationActive && hasConfiguredFinanceInfo

  const schema = React.useMemo(
    () =>
      z.object({
        bankAccountName: z
          .string()
          .trim()
          .min(2, { message: t("validation.bankAccountNameRequired") })
          .max(100),
        bankCardNumber: z
          .string()
          .trim()
          .refine(
            (val) => {
              const digits = val.replace(/\s+/g, "")
              return /^\d{16}$/.test(digits)
            },
            { message: t("validation.bankCardNumberInvalid") }
          ),
        bankShaba: z
          .string()
          .trim()
          .refine(
            (val) => {
              const clean = val.replace(/\s+/g, "").toUpperCase()
              return /^(IR)?\d{24}$/.test(clean)
            },
            { message: t("validation.bankShabaInvalid") }
          ),
      }),
    [t]
  )

  const defaultValues: FormValues = React.useMemo(() => {
    const sanitize = (val?: string | null) =>
      val && val !== "null" && val !== "undefined" ? val : ""
    return {
      bankAccountName: sanitize(institute.bankAccountName),
      bankCardNumber: sanitize(institute.bankCardNumber),
      bankShaba: sanitize(institute.bankShaba),
    }
  }, [institute])

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
    ...institutesResource.updateBankInfo.toMutation(),
    onSuccess: (updated) => {
      toast.success(t("saveSuccess"))
      void queryClient.invalidateQueries({
        queryKey: institutesResource.detail.baseKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: institutesResource.list.baseKey(),
      })
      setActiveInstitute(updated)
      reset({
        bankAccountName: updated.bankAccountName || "",
        bankCardNumber: updated.bankCardNumber || "",
        bankShaba: updated.bankShaba || "",
      })
    },
  })

  const deleteMutation = useMutation({
    ...institutesResource.deleteBankInfo.toMutation(),
    onSuccess: (updated) => {
      toast.success(t("deleteBankInfoSuccess"))
      setIsDeleteDialogOpen(false)
      void queryClient.invalidateQueries({
        queryKey: institutesResource.detail.baseKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: institutesResource.list.baseKey(),
      })
      setActiveInstitute(updated)
      reset({
        bankAccountName: "",
        bankCardNumber: "",
        bankShaba: "",
      })
    },
  })

  const onSubmit = (data: FormValues) => {
    const cleanCard = data.bankCardNumber.replace(/\s+/g, "")
    let cleanShaba = data.bankShaba.replace(/\s+/g, "").toUpperCase()
    if (!cleanShaba.startsWith("IR")) {
      cleanShaba = `IR${cleanShaba}`
    }

    updateMutation.mutate({
      id: institute.id,
      body: {
        bankAccountName: data.bankAccountName.trim(),
        bankCardNumber: cleanCard,
        bankShaba: cleanShaba,
      },
    })
  }

  const isPending = updateMutation.isPending || deleteMutation.isPending

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Section */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {isLocked && (
            <div
              role="alert"
              data-testid="registration-active-warning"
              className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning-foreground"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-bold text-foreground">
                  {t("registrationActiveWarningTitle")}
                </p>
                <p className="text-muted-foreground">
                  {t("registrationActiveWarningDesc")}
                </p>
              </div>
            </div>
          )}

          {isRegistrationActive && !hasConfiguredFinanceInfo && (
            <div
              role="alert"
              data-testid="registration-active-initial-warning"
              className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning-foreground"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-bold text-foreground">
                  {t("registrationActiveInitialWarningTitle")}
                </p>
                <p className="text-muted-foreground">
                  {t("registrationActiveInitialWarningDesc")}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5"
          >
            <Field data-invalid={Boolean(errors.bankAccountName)}>
              <FieldLabel>{t("bankAccountName")}</FieldLabel>
              <Input
                {...register("bankAccountName")}
                placeholder={t("bankAccountNamePlaceholder")}
                disabled={isLocked || isPending}
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
                disabled={isLocked || isPending}
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
                disabled={isLocked || isPending}
              />
              <FieldError>{errors.bankShaba?.message}</FieldError>
            </Field>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <div>
                {hasConfiguredFinanceInfo && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLocked || isPending}
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="me-1.5 size-4" />
                    <span>{t("deleteBankInfo")}</span>
                  </Button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLocked || isPending || !isDirty}
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
        </div>

        {/* Live Preview Section */}
        <div className="lg:col-span-5">
          <FinancialPreviewCard
            bankAccountName={watchedValues.bankAccountName}
            bankCardNumber={watchedValues.bankCardNumber}
            bankShaba={watchedValues.bankShaba}
          />
        </div>
      </div>

      {/* Delete Bank Info Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="overflow-hidden p-0">
          <AlertDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
            <AlertDialogTitle className="text-base font-bold">
              {t("deleteBankInfoConfirmTitle")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {t("deleteBankInfoConfirmDescription")}
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                deleteMutation.mutate(institute.id)
              }}
            >
              {deleteMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                t("delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
