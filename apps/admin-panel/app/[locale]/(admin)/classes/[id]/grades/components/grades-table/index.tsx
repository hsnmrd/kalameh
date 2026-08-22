"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Users, CheckCircle2, XCircle, Info } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
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

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Spinner className="size-8 text-slate-600" />
      </div>
    )
  }

  if (!records || records.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Users className="size-6" />
        </div>
        <p className="text-sm font-medium text-slate-700">{t("table.empty")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-5 py-3 text-start">{t("table.student")}</th>
                <th className="px-5 py-3 text-start">{t("table.phone")}</th>
                <th className="px-5 py-3 text-center">{t("table.score")}</th>
                <th className="px-5 py-3 text-center">{t("table.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {records.map((r) => {
                const override = gradeOverrides[r.studentId]
                const score =
                  override?.finalScore !== undefined
                    ? override.finalScore
                    : (r.finalScore ?? undefined)
                const isPassed =
                  override?.isPassed !== undefined
                    ? override.isPassed
                    : (r.isPassed ??
                      (score !== undefined ? score >= 50 : undefined))

                return (
                  <tr key={r.enrollmentId} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                          {r.student.firstName[0]}
                          {r.student.lastName[0]}
                        </div>
                        <span className="font-medium text-slate-900">
                          {r.student.firstName} {r.student.lastName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {r.student.phone}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex justify-center">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={score ?? ""}
                          onChange={(e) =>
                            handleScoreChange(r.studentId, e.target.value)
                          }
                          placeholder="0-100"
                          className="h-9 w-24 rounded-xl text-center font-mono text-sm"
                        />
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePassToggle(r.studentId, true)}
                          className={
                            isPassed === true
                              ? "h-8 gap-1.5 rounded-lg bg-emerald-50 font-medium text-emerald-700 hover:bg-emerald-100"
                              : "h-8 gap-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
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
                              ? "h-8 gap-1.5 rounded-lg bg-rose-50 font-medium text-rose-700 hover:bg-rose-100"
                              : "h-8 gap-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          }
                        >
                          <XCircle className="size-4" />
                          <span>{t("table.fail")}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="size-4 shrink-0 text-slate-400" />
          <span>{t("progressionNotice")}</span>
        </div>

        <Button
          onClick={handleSubmitAll}
          disabled={isSubmitting}
          className="h-11 cursor-pointer gap-2 rounded-xl bg-slate-900 px-6 font-medium text-white shadow-sm hover:bg-slate-800"
        >
          {isSubmitting ? (
            <>
              <Spinner className="size-4 text-white" />
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
