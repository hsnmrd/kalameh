"use client"

import { useTranslations } from "next-intl"
import type { SchedulingRunDto, SchedulingRunStatusDto } from "@workspace/types"
import { formatSchedulingFailureMessage } from "./helper/failure-message.helper"

interface SnapshotRequirement {
  courseId: string
  course?: { id: string; title: string }
}

function getSnapshotRequirements(snapshot: Record<string, unknown>) {
  const requirements = snapshot.requirements
  if (!Array.isArray(requirements)) return []

  return requirements.filter(
    (value): value is SnapshotRequirement =>
      typeof value === "object" &&
      value !== null &&
      "courseId" in value &&
      typeof value.courseId === "string"
  )
}

interface FailureDetailsProps {
  run: SchedulingRunDto
  result: SchedulingRunStatusDto | undefined
}

export function FailureDetails({ run, result }: FailureDetailsProps) {
  const t = useTranslations("scheduling.runStatus")
  const blockingIssues =
    result?.preflightReport?.issues.filter(
      (issue) => issue.severity === "BLOCKING"
    ) ?? []
  const requirements = getSnapshotRequirements(run.inputSnapshot)
  const displayMessage = formatSchedulingFailureMessage(
    result?.failureMessage,
    t("technicalError")
  )

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-destructive/10 p-4 text-sm leading-6 text-destructive">
      {displayMessage && <p className="font-semibold">{displayMessage}</p>}

      {blockingIssues.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-destructive/20 pt-3">
          <p className="text-xs font-medium text-destructive/80">
            {t("preflightIssues.title")}
          </p>
          <ul className="list-inside list-disc space-y-1">
            {blockingIssues.map((issue, index) => {
              const matchedRequirement = requirements.find(
                (requirement) =>
                  requirement.courseId === issue.entityId ||
                  requirement.course?.id === issue.entityId
              )
              const entityName =
                matchedRequirement?.course?.title || issue.entityId || ""
              const hasTranslation = t.has(`preflightIssues.${issue.code}`)

              return (
                <li key={index} className="text-sm">
                  {hasTranslation
                    ? t(`preflightIssues.${issue.code}`, { entity: entityName })
                    : issue.code}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
