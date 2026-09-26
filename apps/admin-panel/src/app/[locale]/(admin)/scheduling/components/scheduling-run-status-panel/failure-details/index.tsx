"use client"

import { useTranslations } from "next-intl"
import { RotateCcw } from "lucide-react"
import type { SchedulingRunDto, SchedulingRunStatusDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "@/i18n/routing"

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
  const router = useRouter()
  const blockingIssues =
    result?.preflightReport?.issues.filter(
      (issue) => issue.severity === "BLOCKING"
    ) ?? []
  const requirements = getSnapshotRequirements(run.inputSnapshot)

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-destructive/10 p-4 text-sm leading-6 text-destructive">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {result?.failureMessage && (
            <p className="font-semibold">{result.failureMessage}</p>
          )}
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() =>
            router.push(`/scheduling/generate?termId=${run.termId}`)
          }
          className="shrink-0"
        >
          <RotateCcw data-icon="inline-start" className="size-4" />
          {t("retryGeneration")}
        </Button>
      </div>

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
