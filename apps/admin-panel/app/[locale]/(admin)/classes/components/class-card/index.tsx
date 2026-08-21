"use client"

import * as React from "react"
import { Calendar, Users, GraduationCap } from "lucide-react"

export interface ClassCardProps {
  courseName: string
  title: string
  instructor: string
  schedule: string
  enrolledCount: number
  capacity: number
  termFilter: string
}

export function ClassCard({
  courseName,
  title,
  instructor,
  schedule,
  enrolledCount,
  capacity,
  termFilter,
}: ClassCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {courseName}
        </span>
        <span className="text-xs text-slate-400">{termFilter}</span>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <GraduationCap className="size-4" />
          <span>{instructor}</span>
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar className="size-3.5" />
          <span>{schedule}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="size-3.5" />
          <span>
            {enrolledCount} / {capacity}
          </span>
        </div>
      </div>
    </div>
  )
}
