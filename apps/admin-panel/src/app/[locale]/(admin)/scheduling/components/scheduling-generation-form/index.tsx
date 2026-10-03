"use client"

import * as React from "react"
import { Controller } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { Calendar, CalendarClock, Sparkles } from "lucide-react"
import { PERMISSIONS, type SchedulingRunDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import {
  Field,
  FieldDescription,
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
  defaultTermId?: string
  defaultBranchId?: string
  onNavigateToDemand?: () => void
}

export function SchedulingGenerationForm({
  onCreated,
  defaultTermId,
  defaultBranchId,
  onNavigateToDemand,
}: SchedulingGenerationFormProps) {
  const t = useTranslations("scheduling.generation")
  const tTerms = useTranslations("scheduling.termsList")
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

  const activeTerm = React.useMemo(() => {
    if (defaultTermId) {
      const found = terms.find((t) => t.id === defaultTermId)
      if (found) return found
    }
    return terms[0] ?? null
  }, [defaultTermId, terms])

  // Auto-select eligible active term
  React.useEffect(() => {
    if (activeTerm) {
      form.setValue("termId", activeTerm.id, { shouldValidate: true })
    }
  }, [activeTerm, form])

  React.useEffect(() => {
    if (defaultBranchId) {
      form.setValue("branchId", defaultBranchId, { shouldValidate: true })
    }
  }, [defaultBranchId, form])

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
      <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
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

        {activeTerm && (
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant="outline"
              className="gap-2 border-border bg-muted/30 px-3.5 py-1.5 text-xs font-semibold text-foreground sm:text-sm"
            >
              <Calendar className="size-4 text-primary" />
              <span>{activeTerm.title}</span>
            </Badge>
          </div>
        )}
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
        ) : terms.length === 0 && !isScopeLoading ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-5 text-center">
            <CalendarClock
              aria-hidden
              className="size-7 text-muted-foreground"
            />
            <p className="font-semibold text-foreground">
              {tTerms("notEligible.title")}
            </p>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {tTerms("notEligible.description")}
            </p>
          </div>
        ) : (
          <FieldGroup>
            <div className="grid gap-4 md:grid-cols-2">
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
                  disabled={isPending || !termId || requirements.length === 0}
                  className="w-full px-6 sm:w-auto"
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
