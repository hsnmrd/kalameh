"use client"

import * as React from "react"
import { Controller } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { CalendarClock, Sparkles } from "lucide-react"
import { PERMISSIONS, type SchedulingRunDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { useSchedulingGenerationForm } from "../../hooks/use-scheduling-generation-form"
import { SchedulingRequirementPicker } from "../scheduling-requirement-picker"

const ALL_BRANCHES = "ALL_BRANCHES"

interface SchedulingGenerationFormProps {
  onCreated: (run: SchedulingRunDto) => void
  termOptions?: ComboboxOption[]
  defaultTermId?: string
  onNavigateToDemand?: () => void
}

export function SchedulingGenerationForm({
  onCreated,
  termOptions: propTermOptions,
  defaultTermId,
  onNavigateToDemand,
}: SchedulingGenerationFormProps) {
  const t = useTranslations("scheduling.generation")
  const locale = useLocale()
  const {
    form,
    termId,
    requirementIds,
    terms,
    branches,
    requirements,
    isScopeLoading,
    isRequirementsLoading,
    isPending,
    hasInstitute,
    submit,
  } = useSchedulingGenerationForm(onCreated, t("success"))

  const termOptions: ComboboxOption[] =
    propTermOptions ??
    terms.map((term) => ({
      value: term.id,
      label: term.title,
    }))

  // Auto-select default term or first term with requirements
  React.useEffect(() => {
    if (defaultTermId) {
      form.setValue("termId", defaultTermId, { shouldValidate: true })
    } else if (!termId && termOptions.length > 0 && termOptions[0]) {
      form.setValue("termId", termOptions[0].value, { shouldValidate: true })
    }
  }, [defaultTermId, termId, termOptions, form])

  const branchOptions: ComboboxOption[] = [
    { value: ALL_BRANCHES, label: t("fields.branch.all") },
    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
  ]
  const alternativeOptions: ComboboxOption[] = [1, 2, 3].map((count) => ({
    value: String(count),
    label: t("fields.alternatives.option", {
      count: formatNumber(count, locale),
    }),
  }))
  const errors = form.formState.errors

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border px-5 py-5 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles aria-hidden className="size-5" />
        </span>
        <div>
          <h2 className="font-bold text-foreground">{t("title")}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="p-5 sm:p-6">
        {!hasInstitute ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-5 text-center">
            <CalendarClock
              aria-hidden
              className="size-7 text-muted-foreground"
            />
            <p className="font-semibold text-foreground">
              {t("instituteRequired.title")}
            </p>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {t("instituteRequired.description")}
            </p>
          </div>
        ) : (
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-3">
              <Field data-invalid={Boolean(errors.termId)}>
                <FieldLabel>{t("fields.term.label")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="termId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={termOptions}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value ?? "")
                        form.setValue("requirementIds", [])
                      }}
                      disabled={isScopeLoading}
                      placeholder={t("fields.term.placeholder")}
                      searchPlaceholder={t("fields.term.search")}
                      emptyMessage={t("fields.term.empty")}
                      drawerTitle={t("fields.term.drawerTitle")}
                      locale={locale}
                      clearable={false}
                      data-invalid={Boolean(errors.termId)}
                    />
                  )}
                />
                <FieldError>
                  {errors.termId ? t("validation.term") : undefined}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel>{t("fields.branch.label")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={branchOptions}
                      value={field.value ?? ALL_BRANCHES}
                      onValueChange={(value) =>
                        field.onChange(
                          value === ALL_BRANCHES || !value ? null : value
                        )
                      }
                      disabled={isScopeLoading}
                      placeholder={t("fields.branch.placeholder")}
                      drawerTitle={t("fields.branch.drawerTitle")}
                      locale={locale}
                      clearable={false}
                    />
                  )}
                />
                <FieldDescription>
                  {t("fields.branch.description")}
                </FieldDescription>
              </Field>

              <Field data-invalid={Boolean(errors.alternativePlanCount)}>
                <FieldLabel>{t("fields.alternatives.label")}</FieldLabel>
                <Controller
                  control={form.control}
                  name="alternativePlanCount"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={alternativeOptions}
                      value={String(field.value)}
                      onValueChange={(value) =>
                        field.onChange(Number(value ?? 3))
                      }
                      placeholder={t("fields.alternatives.placeholder")}
                      drawerTitle={t("fields.alternatives.drawerTitle")}
                      locale={locale}
                      clearable={false}
                      searchable={false}
                    />
                  )}
                />
              </Field>
            </div>

            <SchedulingRequirementPicker
              items={requirements}
              selectedIds={requirementIds}
              isLoading={isRequirementsLoading}
              hasTerm={Boolean(termId)}
              error={
                errors.requirementIds ? t("validation.requirements") : undefined
              }
              onChange={(ids) =>
                form.setValue("requirementIds", ids, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onNavigateToDemand={onNavigateToDemand}
            />

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {t("selectionSummary", {
                  count: formatNumber(requirementIds.length, locale),
                })}
              </p>
              <PermissionGuard
                permission={PERMISSIONS.MANAGE_CLASSES}
                mode="disable"
                className="w-full sm:w-auto"
              >
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending || !termId || requirements.length === 0}
                  className="h-12 w-full px-6 sm:w-auto"
                >
                  {isPending ? (
                    <Spinner className="size-5 text-primary-foreground" />
                  ) : (
                    <Sparkles aria-hidden data-icon="inline-start" />
                  )}
                  {isPending ? t("submitting") : t("submit")}
                </Button>
              </PermissionGuard>
            </div>
          </FieldGroup>
        )}
      </form>
    </section>
  )
}
