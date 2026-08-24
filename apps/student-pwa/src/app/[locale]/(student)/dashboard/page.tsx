"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Layers, Sparkles } from "lucide-react"
import { QuickActionCard } from "./components/quick-action-card"
import { ActiveEnrollmentCard } from "./components/active-enrollment-card"

export default function StudentDashboardPage() {
  const t = useTranslations("dashboard")

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <QuickActionCard
          href="/classes"
          title={t("allowedClasses")}
          description={t("allowedClassesDesc")}
          icon={Layers}
          iconBgClassName="bg-sky-500/10"
          iconColorClassName="text-sky-600"
        />

        <QuickActionCard
          href="/flashcards"
          title={t("flashcards")}
          description={t("flashcardsDesc")}
          icon={Sparkles}
          iconBgClassName="bg-emerald-500/10"
          iconColorClassName="text-emerald-600"
        />
      </div>

      {/* Active Enrollment Status Card */}
      <ActiveEnrollmentCard
        classNameTitle={t("className")}
        statusText={t("statusPendingApproval")}
        termText={t("term")}
        description={t("receiptStatusDesc")}
        actionHref="/enrollments"
      />
    </div>
  )
}
