"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { StudentClassCard } from "./components/student-class-card"

export default function StudentClassesPage() {
  const t = useTranslations("classes")

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t("title")}
        </h1>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="space-y-4">
        <StudentClassCard
          classNameTitle={t("className")}
          scheduleDays={t("scheduleDays")}
          scheduleTime={t("scheduleTime")}
          capacity={t("capacity")}
        />
      </div>
    </div>
  )
}
