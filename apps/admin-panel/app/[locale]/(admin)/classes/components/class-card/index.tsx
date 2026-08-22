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
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          {courseName}
        </span>
        <span className="text-xs text-muted-foreground">{termFilter}</span>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <GraduationCap className="size-4" />
          <span>{instructor}</span>
        </p>
      </div>
      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
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
