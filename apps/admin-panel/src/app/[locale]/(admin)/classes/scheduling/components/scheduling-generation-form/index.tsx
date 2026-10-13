"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Building2, Calendar, CalendarClock, Sparkles } from "lucide-react"
import { PERMISSIONS, type SchedulingRunDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { PermissionGuard } from "@/components/permission-guard"
import { useSchedulingGenerationForm } from "../../hooks/use-scheduling-generation-form"
import { SchedulingRequirementPicker } from "../scheduling-requirement-picker"
import { SchedulingStudentScheduleWarning } from "../scheduling-student-schedule-warning"
import { SchedulingStudentScheduleConfirmation } from "../scheduling-student-schedule-confirmation"

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
  } = useSchedulingGenerationForm(onCreated, t("success"), {
    termId: defaultTermId,
    branchId: defaultBranchId,
  })

  const activeTerm = React.useMemo(() => {
    if (defaultTermId) {
      const found = terms.find((t) => t.id === defaultTermId)
      if (found) return found
    }
    return terms[0] ?? null
  }, [defaultTermId, terms])

  const activeBranch = React.useMemo(() => {
    if (defaultBranchId) {
      const found = branches.find((b) => b.id === defaultBranchId)
      if (found) return found
    }
    const formBranchId = form.getValues("branchId")
    if (formBranchId) {
      const found = branches.find((b) => b.id === formBranchId)
      if (found) return found
    }
    return branches[0] ?? null
  }, [defaultBranchId, branches, form])

  // Auto-select eligible active term
  React.useEffect(() => {
    if (activeTerm) {
      form.setValue("termId", activeTerm.id, { shouldValidate: true })
    }
  }, [activeTerm, form])

  React.useEffect(() => {
    if (defaultBranchId) {
      form.setValue("branchId", defaultBranchId, { shouldValidate: true })
    } else if (!form.getValues("branchId") && branches.length > 0) {
      form.setValue("branchId", branches[0]!.id, { shouldValidate: true })
    }
  }, [defaultBranchId, branches, form])

  const errors = form.formState.errors

  const isSubmitDisabled =
    isPending ||
    !termId ||
    requirements.length === 0 ||
    requirementIds.length === 0 ||
    !activeTerm?.studentSchedulesConfirmedAt

  return (
    <div className="flex w-full flex-col">
      <form onSubmit={submit} className="w-full">
        {/* Desktop Sticky Filter Section / Header */}
        <AdminFilterBar
          autoHideOnMobile={false}
          search={
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles aria-hidden className="size-5" />
                </span>
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  {t("title")}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeTerm && (
                  <Badge
                    variant="outline"
                    className="gap-2 border-border bg-muted/40 px-3.5 py-1.5 text-xs font-semibold text-foreground sm:text-sm"
                  >
                    <Calendar className="size-4 text-foreground" />
                    <span>{activeTerm.title}</span>
                  </Badge>
                )}
                {activeBranch && (
                  <Badge
                    variant="outline"
                    className="gap-2 border-border bg-muted/40 px-3.5 py-1.5 text-xs font-semibold text-foreground sm:text-sm"
                  >
                    <Building2 className="size-4 text-foreground" />
                    <span>{activeBranch.name}</span>
                  </Badge>
                )}
              </div>
            </div>
          }
          actions={
            <PermissionGuard
              permission={PERMISSIONS.MANAGE_CLASSES}
              mode="hide"
            >
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="gap-2"
              >
                {isPending ? (
                  <Spinner className="size-4 text-primary-foreground" />
                ) : (
                  <Sparkles
                    className="size-4 text-primary-foreground"
                    aria-hidden
                  />
                )}
                <span>{isPending ? t("submitting") : t("submit")}</span>
              </Button>
            </PermissionGuard>
          }
        />

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
          <div className="flex flex-col gap-6">
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

            <SchedulingStudentScheduleConfirmation term={activeTerm} />

            <SchedulingStudentScheduleWarning
              requirements={requirements}
              selectedRequirementIds={requirementIds}
            />

            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {t("selectionSummary", {
                  count: formatNumber(requirementIds.length, locale),
                })}
              </p>
            </div>
          </div>
        )}

        {/* Mobile Bottom Sticky Button */}
        <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-lg backdrop-blur-md sm:hidden">
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="h-14 w-full cursor-pointer gap-2 rounded-2xl text-base font-semibold shadow-xs"
            >
              {isPending ? (
                <Spinner className="size-5 text-primary-foreground" />
              ) : (
                <Sparkles
                  className="size-5 text-primary-foreground"
                  aria-hidden
                />
              )}
              <span>{isPending ? t("submitting") : t("submit")}</span>
            </Button>
          </div>
        </PermissionGuard>
      </form>
    </div>
  )
}
