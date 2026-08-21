"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

export interface StudentClassCardProps {
  classNameTitle: string
  scheduleDays: string
  scheduleTime: string
  capacity: string
  onEnroll?: () => void
}

export function StudentClassCard({
  classNameTitle,
  scheduleDays,
  scheduleTime,
  capacity,
  onEnroll,
}: StudentClassCardProps) {
  const t = useTranslations("classes")

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {t("openForEnrollment")}
        </span>
        <span className="text-xs text-slate-400">{capacity}</span>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">
          {classNameTitle}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="size-3.5" />
          <span>{scheduleDays}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="size-3.5" />
          <span>{scheduleTime}</span>
        </p>
      </div>

      <Button
        onClick={onEnroll}
        className="w-full cursor-pointer bg-black text-white hover:bg-slate-800"
      >
        {t("enrollButton")}
      </Button>
    </div>
  )
}
