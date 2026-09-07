"use client"

import { useTranslations } from "next-intl"
import { Check, Palette } from "lucide-react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Attachment } from "@workspace/ui/components/attachment"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import type { UpdateInstituteInput } from "../../../hooks/use-institute-schemas"
import { BRAND_COLOR_PRESETS } from "../../institute-form-types"

interface GeneralFieldsProps {
  form: UseFormReturn<UpdateInstituteInput>
  visible: boolean
}

export function GeneralFields({ form, visible }: GeneralFieldsProps) {
  const t = useTranslations("institutes")
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = form
  const selectedColor = watch("primaryColor") || "#10b981"
  const logoUrl = watch("logoUrl")
  return (
    <div className={cn("flex flex-col gap-4", !visible && "hidden")}>
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel>{t("createModal.name")}</FieldLabel>
        <Input {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.subdomain)}>
        <FieldLabel>{t("createModal.subdomain")}</FieldLabel>
        <div className="relative flex items-center" dir="ltr">
          <Input {...register("subdomain")} className="pe-28 font-mono" />
          <span className="pointer-events-none absolute end-3 font-mono text-xs text-muted-foreground">
            {t("createModal.subdomainSuffix")}
          </span>
        </div>
        <FieldError>{errors.subdomain?.message}</FieldError>
      </Field>
      <Field className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Checkbox
                id="edit-institute-isActive"
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
              />
            )}
          />
          <label
            htmlFor="edit-institute-isActive"
            className="cursor-pointer text-xs font-medium text-foreground select-none"
          >
            {t("createModal.statusActive")}
          </label>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t("editModal.statusActiveHint")}
        </p>
      </Field>
      <Field>
        <FieldLabel>{t("createModal.logo")}</FieldLabel>
        <Controller
          control={control}
          name="logo"
          render={({ field }) => (
            <Attachment
              value={
                field.value || (logoUrl ? getAssetUrl(logoUrl) : undefined)
              }
              onChange={(file) => {
                field.onChange(file)
                if (!file) setValue("logoUrl", null, { shouldDirty: true })
              }}
              placeholder={t("createModal.logoPlaceholder")}
              description={t("createModal.logoDescription")}
              removeLabel={t("createModal.removePhone")}
            />
          )}
        />
      </Field>
      <Field data-invalid={Boolean(errors.primaryColor)}>
        <div className="flex items-center justify-between">
          <FieldLabel className="flex items-center gap-1.5">
            <Palette className="size-4 text-muted-foreground" />
            <span>{t("createModal.primaryColor")}</span>
          </FieldLabel>
          <div
            className="size-5 rounded-full border border-border shadow-2xs"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {BRAND_COLOR_PRESETS.map((preset) => {
            const picked =
              selectedColor.toLowerCase() === preset.value.toLowerCase()
            return (
              <Button
                key={preset.value}
                type="button"
                variant="ghost"
                onClick={() => setValue("primaryColor", preset.value)}
                className={cn(
                  "relative size-8 cursor-pointer rounded-full p-0 transition-transform hover:scale-110",
                  picked && "ring-2 ring-foreground ring-offset-2"
                )}
                style={{ backgroundColor: preset.value }}
                aria-label={preset.name}
              >
                {picked && (
                  <Check className="size-4 text-white drop-shadow-xs" />
                )}
              </Button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t("createModal.primaryColorCustom")}:
          </span>
          <Input
            {...register("primaryColor")}
            placeholder={t("createModal.primaryColorPlaceholder")}
            className="h-8 max-w-[120px] rounded-lg font-mono text-xs"
            dir="ltr"
          />
        </div>
        <FieldError>{errors.primaryColor?.message}</FieldError>
      </Field>
    </div>
  )
}
