"use client"

import { useTranslations } from "next-intl"
import { Check, Palette } from "lucide-react"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Attachment } from "@workspace/ui/components/attachment"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import type { CreateInstituteInput } from "../../../hooks/use-institute-schemas"
import { BRAND_COLOR_PRESETS } from "../../institute-form-types"

interface GeneralFieldsProps {
  form: UseFormReturn<CreateInstituteInput>
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
  return (
    <div className={cn("flex flex-col gap-5", !visible && "hidden")}>
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel>{t("createModal.name")}</FieldLabel>
        <Input
          {...register("name")}
          placeholder={t("createModal.namePlaceholder")}
        />
        <FieldError>{errors.name?.message}</FieldError>
      </Field>
      <Field data-invalid={Boolean(errors.subdomain)}>
        <FieldLabel>{t("createModal.subdomain")}</FieldLabel>
        <div className="relative flex items-center" dir="ltr">
          <Input
            {...register("subdomain")}
            placeholder={t("createModal.subdomainPlaceholder")}
            className="pe-36 font-mono text-base placeholder:font-sans"
          />
          <span className="pointer-events-none absolute end-4 font-mono text-base font-normal text-muted-foreground select-none">
            {t("createModal.subdomainSuffix")}
          </span>
        </div>
        <FieldError>{errors.subdomain?.message}</FieldError>
      </Field>
      <Field>
        <FieldLabel>{t("createModal.logo")}</FieldLabel>
        <Controller
          control={control}
          name="logo"
          render={({ field }) => (
            <Attachment
              value={field.value}
              onChange={field.onChange}
              placeholder={t("createModal.logoPlaceholder")}
              description={t("createModal.logoDescription")}
              removeLabel={t("createModal.removePhone")}
            />
          )}
        />
      </Field>
      <Field data-invalid={Boolean(errors.primaryColor)}>
        <Card className="rounded-2xl border border-border/80 bg-card shadow-2xs">
          <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Palette
                className="size-4.5 text-muted-foreground"
                aria-hidden="true"
              />
              <span>{t("createModal.primaryColor")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5 p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="flex flex-wrap items-center gap-2.5">
              {BRAND_COLOR_PRESETS.map((preset) => {
                const picked =
                  selectedColor.toLowerCase() === preset.value.toLowerCase()
                return (
                  <Button
                    key={preset.value}
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setValue("primaryColor", preset.value, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "relative size-9 cursor-pointer rounded-full p-0 transition-transform hover:scale-105",
                      picked &&
                        "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                    )}
                    style={{ backgroundColor: preset.value }}
                    aria-label={preset.name}
                  >
                    {picked && (
                      <Check
                        className="size-4 text-white drop-shadow-xs"
                        aria-hidden="true"
                      />
                    )}
                  </Button>
                )
              })}
            </div>
            <div className="flex items-center gap-2.5 border-t border-border/60 pt-3">
              <span className="text-xs font-medium text-muted-foreground">
                {t("createModal.primaryColorCustom")}:
              </span>
              <Input
                {...register("primaryColor")}
                placeholder={t("createModal.primaryColorPlaceholder")}
                className="h-10 max-w-[140px] rounded-xl font-mono text-xs"
                dir="ltr"
              />
            </div>
            {errors.primaryColor?.message && (
              <FieldError>{errors.primaryColor.message}</FieldError>
            )}
          </CardContent>
        </Card>
      </Field>
    </div>
  )
}
