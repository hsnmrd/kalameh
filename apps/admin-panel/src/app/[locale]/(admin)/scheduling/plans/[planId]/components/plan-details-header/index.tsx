"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  CalendarRange,
  MapPin,
  MousePointerClick,
  Send,
  ShieldCheck,
} from "lucide-react"
import {
  PERMISSIONS,
  type SchedulingPlanDetailsDto,
  type SchedulingPlanValidation,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatDate } from "@workspace/ui/lib/utils"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { PermissionGuard } from "@/components/permission-guard"
import { useSchedulingPlanPublication } from "../../../../hooks/use-scheduling-plan-publication"
import { SchedulingPlanPublicationDialog } from "../../../../components/scheduling-plan-publication-dialog"

export interface PlanDetailsHeaderProps {
  plan: SchedulingPlanDetailsDto
  isSelected: boolean
  isSelectionPending: boolean
  isSelecting: boolean
  isValidationPending: boolean
  hasValidationResult: boolean
  validationResult?: SchedulingPlanValidation
  onSelect: () => void
  onValidate: () => void
  onValidationBlocked: (validation: SchedulingPlanValidation) => void
  selectedTeacherId?: string | null
  onTeacherChange?: (teacherId: string | null) => void
}

export function PlanDetailsHeader({
  plan,
  isSelected,
  isSelectionPending,
  isSelecting,
  isValidationPending,
  hasValidationResult,
  validationResult,
  onSelect,
  onValidate,
  onValidationBlocked,
  selectedTeacherId,
  onTeacherChange,
}: PlanDetailsHeaderProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const [isConfirmationOpen, setIsConfirmationOpen] = React.useState(false)

  const publication = useSchedulingPlanPublication(plan, {
    onPublished: () => setIsConfirmationOpen(false),
    onValidationBlocked: (validation) => {
      setIsConfirmationOpen(false)
      onValidationBlocked(validation)
    },
  })

  const teacherOptions: ComboboxOption[] = React.useMemo(() => {
    const teachersMap = new Map<string, string>()
    for (const calendar of plan.teacherCalendars ?? []) {
      const name =
        `${calendar.teacher.firstName} ${calendar.teacher.lastName}`.trim()
      teachersMap.set(calendar.teacher.id, name)
    }
    for (const proposal of plan.proposals ?? []) {
      if (proposal.teacher) {
        const name =
          `${proposal.teacher.firstName} ${proposal.teacher.lastName}`.trim()
        teachersMap.set(proposal.teacher.id, name)
      }
    }
    const options = Array.from(teachersMap.entries()).map(([value, label]) => ({
      value,
      label,
    }))
    options.sort((a, b) => a.label.localeCompare(b.label, locale))
    return options
  }, [plan.teacherCalendars, plan.proposals, locale])

  const canValidate = plan.status === "SELECTED"
  const canPublish =
    canValidate && !isValidationPending && validationResult?.isValid === true

  const headerActions = (
    <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
      {canValidate ? (
        <>
          <Button
            type="button"
            variant={canPublish ? "outline" : "default"}
            disabled={isValidationPending || publication.isPending}
            onClick={onValidate}
            className="w-full shrink-0 cursor-pointer gap-2 px-5 font-semibold shadow-xs sm:w-auto"
          >
            {isValidationPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <ShieldCheck aria-hidden data-icon="inline-start" />
            )}
            {isValidationPending
              ? t("validation.validating")
              : hasValidationResult
                ? t("validation.validateAgain")
                : t("validation.validate")}
          </Button>
          {canPublish && (
            <Button
              type="button"
              disabled={publication.isPending}
              onClick={() => setIsConfirmationOpen(true)}
              className="w-full shrink-0 cursor-pointer gap-2 px-5 font-semibold shadow-xs sm:w-auto"
            >
              <Send aria-hidden data-icon="inline-start" />
              {t("publication.publish")}
            </Button>
          )}
        </>
      ) : (
        plan.status === "DRAFT" && (
          <Button
            type="button"
            disabled={isSelectionPending}
            onClick={onSelect}
            className="w-full shrink-0 cursor-pointer gap-2 px-5 font-semibold shadow-xs sm:w-auto"
          >
            {isSelecting ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <MousePointerClick aria-hidden data-icon="inline-start" />
            )}
            {isSelecting ? t("selection.selecting") : t("selection.select")}
          </Button>
        )
      )}
    </PermissionGuard>
  )

  return (
    <>
      <AdminFilterBar
        className="mb-0 lg:mb-0"
        autoHideOnMobile={false}
        activeFiltersCount={selectedTeacherId ? 1 : 0}
        isPinned={Boolean(selectedTeacherId)}
        onClearFilters={() => onTeacherChange?.(null)}
        filterDialogTitle={t("teacherFilter")}
        filters={
          <Field className="w-full">
            <FieldLabel>{t("teacherFilter")}</FieldLabel>
            <ResponsiveCombobox
              items={teacherOptions}
              value={selectedTeacherId ?? ""}
              onValueChange={(val) => onTeacherChange?.(val || null)}
              placeholder={t("selectTeacherPlaceholder")}
              searchPlaceholder={t("searchTeacherPlaceholder")}
              drawerTitle={t("teacherFilter")}
              emptyMessage={t("noTeachersFound")}
              clearable={true}
            />
          </Field>
        }
        search={
          <dl className="grid min-h-14 w-full min-w-0 grid-cols-2 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm sm:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{t("term")}</dt>
              <dd className="flex items-center gap-2 truncate font-semibold text-foreground">
                <CalendarRange aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{plan.run.term?.title ?? "-"}</span>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{t("branch")}</dt>
              <dd className="flex items-center gap-2 truncate font-semibold text-foreground">
                <MapPin aria-hidden className="size-4 shrink-0" />
                <span className="truncate">
                  {plan.run.branch?.name ?? t("allBranches")}
                </span>
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">
                {t("generatedAt")}
              </dt>
              <dd className="truncate font-semibold text-foreground">
                {formatDate(plan.generatedAt, locale)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">
                {t("qualityIndex")}
              </dt>
              <dd className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                <span>
                  {plan.qualityIndex == null
                    ? "—"
                    : new Intl.NumberFormat(locale, {
                        style: "percent",
                        maximumFractionDigits: 2,
                      }).format(plan.qualityIndex / 100)}
                </span>
                {isSelected && <Badge>{t("selected")}</Badge>}
                {plan.status === "PUBLISHED" && (
                  <Badge variant="success">{t("published")}</Badge>
                )}
                {plan.status === "REJECTED" && (
                  <Badge variant="secondary">{t("rejected")}</Badge>
                )}
              </dd>
            </div>
          </dl>
        }
        actions={headerActions}
      />

      <SchedulingPlanPublicationDialog
        open={isConfirmationOpen}
        plan={plan}
        isPending={publication.isPending}
        onClose={() => setIsConfirmationOpen(false)}
        onConfirm={publication.publish}
      />
    </>
  )
}
