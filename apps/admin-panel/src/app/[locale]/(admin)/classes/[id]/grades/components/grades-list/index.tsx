"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Users, CheckCircle2, XCircle, Info } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  MobileList,
  MobileListItem,
  MobileListItemIcon,
  MobileListItemContent,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty"
import {
  PERMISSIONS,
  type ClassGradeRecordDto,
  type SingleStudentGradeInput,
} from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"

export interface GradesListProps {
  records: ClassGradeRecordDto[] | undefined
  isLoading: boolean
  isSubmitting: boolean
  onSubmit: (grades: SingleStudentGradeInput[]) => void
}

export function GradesList({
  records,
  isLoading,
  isSubmitting,
  onSubmit,
}: GradesListProps) {
  const t = useTranslations("grades")

  const [gradeOverrides, setGradeOverrides] = React.useState<
    Record<string, { finalScore?: number; isPassed?: boolean }>
  >({})

  const handleScoreChange = (studentId: string, valueStr: string) => {
    const num =
      valueStr === "" ? undefined : Math.min(100, Math.max(0, Number(valueStr)))
    setGradeOverrides((prev) => ({
      ...prev,
      [studentId]: {
        finalScore: num,
        isPassed: num !== undefined ? num >= 50 : prev[studentId]?.isPassed,
      },
    }))
  }

  const handlePassToggle = (studentId: string, isPassed: boolean) => {
    setGradeOverrides((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isPassed,
      },
    }))
  }

  const handleSubmitAll = () => {
    if (!records) return
    const payload: SingleStudentGradeInput[] = records.map((r) => {
      const override = gradeOverrides[r.studentId]
      const finalScore =
        override?.finalScore !== undefined
          ? override.finalScore
          : (r.finalScore ?? undefined)
      const isPassed =
        override?.isPassed !== undefined
          ? override.isPassed
          : (r.isPassed ??
            (finalScore !== undefined ? finalScore >= 50 : undefined))
      return {
        studentId: r.studentId,
        finalScore,
        isPassed,
      }
    })
    onSubmit(payload)
  }

  if (isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Users className="size-6" />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-4">
      <MobileList>
        {records.map((r, index) => {
          const override = gradeOverrides[r.studentId]
          const score =
            override?.finalScore !== undefined
              ? override.finalScore
              : (r.finalScore ?? undefined)
          const isPassed =
            override?.isPassed !== undefined
              ? override.isPassed
              : (r.isPassed ?? (score !== undefined ? score >= 50 : undefined))

          return (
            <MobileListItem
              key={r.studentId}
              isLast={index === records.length - 1}
              className="flex-col items-stretch gap-2.5 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {r.student.firstName[0]}
                    {r.student.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {r.student.firstName} {r.student.lastName}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {r.student.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePassToggle(r.studentId, true)}
                    className={
                      isPassed === true
                        ? "h-8 gap-1 rounded-lg bg-emerald-500/10 px-2 text-xs font-medium text-emerald-600"
                        : "h-8 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted"
                    }
                  >
                    <CheckCircle2 className="size-3.5" />
                    <span>{t("table.pass")}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePassToggle(r.studentId, false)}
                    className={
                      isPassed === false
                        ? "h-8 gap-1 rounded-lg bg-rose-500/10 px-2 text-xs font-medium text-rose-600"
                        : "h-8 gap-1 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted"
                    }
                  >
                    <XCircle className="size-3.5" />
                    <span>{t("table.fail")}</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t("table.score")}:
                </span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={score ?? ""}
                  onChange={(e) =>
                    handleScoreChange(r.studentId, e.target.value)
                  }
                  placeholder={t("table.scorePlaceholder")}
                  className="h-8 w-24 rounded-lg font-mono text-xs"
                />
              </div>
            </MobileListItem>
          )
        })}
      </MobileList>

      {/* Submit footer */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground" />
          <span>{t("progressionNotice")}</span>
        </div>

        <PermissionGuard permission={PERMISSIONS.MANAGE_GRADES} mode="disable">
          <Button
            onClick={handleSubmitAll}
            disabled={isSubmitting}
            className="h-10 w-full cursor-pointer gap-2 rounded-xl bg-primary font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Spinner className="size-4 text-primary-foreground" />
                <span>{t("submitting")}</span>
              </>
            ) : (
              <span>{t("submitAll")}</span>
            )}
          </Button>
        </PermissionGuard>
      </div>
    </div>
  )
}
