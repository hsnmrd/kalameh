"use client"

import { useLocale, useTranslations } from "next-intl"
import type { SchedulingWarning } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingWarningListProps {
  warnings: SchedulingWarning[]
  ariaLabel: string
}

const KNOWN_WARNING_CODES = new Set([
  "GENERATION_PENDING",
  "MISSING_SCHEDULED_CLASSES",
  "NEUTRAL_TIME_GROUP_USED",
  "TIME_PATTERN_NOT_DIVERSE",
  "TIME_GROUP_IMBALANCED",
  "MANUAL_EDIT_REQUIRES_VALIDATION",
])

const EDITABLE_FIELD_KEYS = new Set([
  "title",
  "teacherId",
  "branchId",
  "classroomId",
  "capacity",
  "deliveryMode",
  "daysOfWeek",
  "startTime",
  "endTime",
])

export function SchedulingWarningList({
  warnings,
  ariaLabel,
}: SchedulingWarningListProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  return (
    <ul aria-label={ariaLabel} className="flex flex-col gap-2">
      {warnings.map((warning, index) => {
        const requiredClassCount = Number(
          warning.context.requiredClassCount ?? Number.NaN
        )
        const scheduledClassCount = Number(
          warning.context.scheduledClassCount ?? Number.NaN
        )
        const spread = Number(warning.context.spread ?? Number.NaN)
        const changedFields = Array.isArray(warning.context.changedFields)
          ? warning.context.changedFields.filter(
              (field): field is string =>
                typeof field === "string" && EDITABLE_FIELD_KEYS.has(field)
            )
          : []
        const context =
          Number.isFinite(requiredClassCount) &&
          Number.isFinite(scheduledClassCount)
            ? t("warningContexts.classCount", {
                required: formatNumber(requiredClassCount, locale),
                scheduled: formatNumber(scheduledClassCount, locale),
              })
            : Number.isFinite(spread)
              ? t("warningContexts.spread", {
                  count: formatNumber(spread, locale),
                })
              : changedFields.length > 0
                ? t("warningContexts.changedFields", {
                    fields: changedFields
                      .map((field) => t(`editableFields.${field}`))
                      .join(t("daySeparator")),
                  })
                : null

        return (
          <li
            key={`${warning.code}-${index}`}
            className="rounded-xl border border-border p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  warning.severity === "WARNING" ? "warning" : "secondary"
                }
              >
                {t(`warningSeverities.${warning.severity}`)}
              </Badge>
              <p className="text-sm font-semibold text-foreground">
                {KNOWN_WARNING_CODES.has(warning.code)
                  ? t(`warningMessages.${warning.code}`)
                  : warning.code}
              </p>
            </div>
            {context && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {context}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
