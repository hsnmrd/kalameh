"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { User, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import type { ClassDto } from "@workspace/types"

export interface StudentClassCardProps {
  cls: ClassDto
  onEnroll?: (cls: ClassDto) => void
}

export function StudentClassCard({ cls, onEnroll }: StudentClassCardProps) {
  const t = useTranslations("classes")
  const locale = useLocale()

  const enrolled = cls.enrolledCount ?? 0
  const isFull = enrolled >= cls.capacity

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(
      amount
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">
          {cls.term?.title}
        </span>
        <Badge
          variant="outline"
          className={
            isFull
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }
        >
          {isFull ? (
            t("full")
          ) : (
            <span className="font-mono">
              {enrolled} / {cls.capacity}
            </span>
          )}
        </Badge>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">{cls.title}</h2>
        {cls.teacherName && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
            <User className="size-3.5 text-slate-400" />
            <span>
              {t("teacher")}: {cls.teacherName}
            </span>
          </p>
        )}
        {cls.schedule && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="size-3.5 text-slate-400" />
            <span>{cls.schedule}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div>
          <span className="block text-[11px] text-slate-400">
            {t("tuition")}
          </span>
          <span className="font-mono text-sm font-bold text-slate-900">
            {formatCurrency(cls.fee)} {t("toman")}
          </span>
        </div>

        <Button
          onClick={() => onEnroll?.(cls)}
          disabled={isFull}
          className="h-10 cursor-pointer rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50"
        >
          <CheckCircle2 className="me-1.5 size-4" />
          <span>{t("enrollButton")}</span>
        </Button>
      </div>
    </div>
  )
}
