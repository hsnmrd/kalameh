"use client"

import { useTranslations } from "next-intl"
import { Phone, Plus, Trash2 } from "lucide-react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import type { UpdateInstituteInput } from "../../../hooks/use-institute-schemas"
import { ModulesSelector } from "../../modules-selector"
import type { InstituteFormTab } from "../../institute-form-types"

interface SupplementalFieldsProps {
  form: UseFormReturn<UpdateInstituteInput>
  activeTab: InstituteFormTab
  onAddPhone: () => void
  onRemovePhone: (index: number) => void
}

export function SupplementalFields({
  form,
  activeTab,
  onAddPhone,
  onRemovePhone,
}: SupplementalFieldsProps) {
  const t = useTranslations("institutes")
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = form
  const phones = watch("phones") || [""]
  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-4",
          activeTab !== "modules" && "hidden"
        )}
      >
        <Controller
          control={control}
          name="enabledModules"
          render={({ field }) => (
            <ModulesSelector
              value={field.value || []}
              onChange={field.onChange}
            />
          )}
        />
      </div>
      <div
        className={cn(
          "flex flex-col gap-4",
          activeTab !== "contact" && "hidden"
        )}
      >
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel className="flex items-center gap-1.5">
              <Phone className="size-4 text-muted-foreground" />
              <span>{t("createModal.phones")}</span>
            </FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddPhone}
              className="h-7 cursor-pointer rounded-lg px-2.5 text-xs text-foreground"
            >
              <Plus className="me-1 size-3" />
              {t("createModal.addPhone")}
            </Button>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {phones.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  {...register(`phones.${index}` as const)}
                  placeholder={t("createModal.phonePlaceholder")}
                  className="h-10 flex-1 rounded-xl font-mono text-sm"
                  dir="ltr"
                />
                {phones.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemovePhone(index)}
                    className="size-9 shrink-0 cursor-pointer rounded-lg p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Field>
        <Field data-invalid={Boolean(errors.address)}>
          <FieldLabel>{t("createModal.address")}</FieldLabel>
          <Input {...register("address")} />
          <FieldError>{errors.address?.message}</FieldError>
        </Field>
      </div>
      <div
        className={cn(
          "flex flex-col gap-4",
          activeTab !== "banking" && "hidden"
        )}
      >
        <Field data-invalid={Boolean(errors.bankAccountName)}>
          <FieldLabel>{t("createModal.bankAccountName")}</FieldLabel>
          <Input {...register("bankAccountName")} />
          <FieldError>{errors.bankAccountName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.bankCardNumber)}>
          <FieldLabel>{t("createModal.bankCardNumber")}</FieldLabel>
          <Input
            {...register("bankCardNumber")}
            className="font-mono"
            dir="ltr"
          />
          <FieldError>{errors.bankCardNumber?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(errors.bankShaba)}>
          <FieldLabel>{t("createModal.bankShaba")}</FieldLabel>
          <Input {...register("bankShaba")} className="font-mono" dir="ltr" />
          <FieldError>{errors.bankShaba?.message}</FieldError>
        </Field>
      </div>
    </>
  )
}
