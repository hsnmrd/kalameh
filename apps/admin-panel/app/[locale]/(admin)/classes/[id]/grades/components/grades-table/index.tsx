"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { type ColumnDef } from "@tanstack/react-table"
import { Users, CheckCircle2, XCircle, Info } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { DataTable } from "@workspace/ui/components/data-table"
import type {
  ClassGradeRecordDto,
  SingleStudentGradeInput,
} from "@workspace/types"

export interface GradesTableProps {
  records: ClassGradeRecordDto[] | undefined
  isLoading: boolean
  isSubmitting: boolean
  onSubmit: (grades: SingleStudentGradeInput[]) => void
}

export function GradesTable({
  records,
  isLoading,
  isSubmitting,
  onSubmit,
}: GradesTableProps) {
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

  const columns = React.useMemo<ColumnDef<ClassGradeRecordDto>[]>(
    () => [
      {
        accessorKey: "student",
        header: t("table.student"),
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {r.student.firstName[0]}
                {r.student.lastName[0]}
              </div>
              <span className="font-medium text-foreground">
                {r.student.firstName} {r.student.lastName}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "phone",
        header: t("table.phone"),
        cell: ({ row }) => (
          <span className="font-mono text-foreground/80">
            {row.original.student.phone}
          </span>
        ),
      },
      {
        accessorKey: "score",
        header: () => <div className="text-center">{t("table.score")}</div>,
        cell: ({ row }) => {
          const r = row.original
          const override = gradeOverrides[r.studentId]
          const score =
            override?.finalScore !== undefined
              ? override.finalScore
              : (r.finalScore ?? undefined)

          return (
            <div className="flex justify-center">
              <Input
                type="number"
                min={0}
                max={100}
                value={score ?? ""}
                onChange={(e) => handleScoreChange(r.studentId, e.target.value)}
                placeholder="0-100"
                className="h-9 w-24 rounded-xl text-center font-mono text-sm"
              />
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">{t("table.status")}</div>,
        cell: ({ row }) => {
          const r = row.original
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
            <div className="flex items-center justify-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handlePassToggle(r.studentId, true)}
                className={
                  isPassed === true
                    ? "h-8 gap-1.5 rounded-lg bg-emerald-500/10 font-medium text-emerald-600 hover:bg-emerald-500/20"
                    : "h-8 gap-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              >
                <CheckCircle2 className="size-4" />
                <span>{t("table.pass")}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handlePassToggle(r.studentId, false)}
                className={
                  isPassed === false
                    ? "h-8 gap-1.5 rounded-lg bg-rose-500/10 font-medium text-rose-600 hover:bg-rose-500/20"
                    : "h-8 gap-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              >
                <XCircle className="size-4" />
                <span>{t("table.fail")}</span>
              </Button>
            </div>
          )
        },
      },
    ],
    [t, gradeOverrides]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-border bg-card">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users className="size-6" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {t("table.empty")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DataTable columns={columns} data={records} />

      {/* Action Footer */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-4 shrink-0 text-muted-foreground" />
          <span>{t("progressionNotice")}</span>
        </div>

        <Button
          onClick={handleSubmitAll}
          disabled={isSubmitting}
          className="h-11 cursor-pointer gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
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
      </div>
    </div>
  )
}
