"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { Layers, Sparkles } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { ENROLLMENT_STATUSES } from "@workspace/types"
import { enrollmentsResource } from "@/lib/api"
import { QuickActionCard } from "./components/quick-action-card"
import { ActiveEnrollmentCard } from "./components/active-enrollment-card"

export default function StudentDashboardPage() {
  const t = useTranslations("dashboard")
  const tEnrollments = useTranslations("enrollments")

  const { data: enrollments, isLoading } = useQuery(
    enrollmentsResource.my.toQuery()
  )

  const activeEnrollment = enrollments?.find(
    (e) =>
      e.status === ENROLLMENT_STATUSES.PENDING_PAYMENT ||
      e.status === ENROLLMENT_STATUSES.PENDING_APPROVAL ||
      e.status === ENROLLMENT_STATUSES.ENROLLED ||
      e.status === ENROLLMENT_STATUSES.WAITLISTED
  )

  const renderEnrollmentCard = () => {
    if (isLoading) {
      return (
        <div className="flex h-36 w-full items-center justify-center rounded-2xl border border-border bg-card">
          <Spinner className="size-6 text-foreground" />
        </div>
      )
    }

    if (!activeEnrollment) {
      return (
        <ActiveEnrollmentCard
          classNameTitle={t("noEnrollmentTitle")}
          description={t("noEnrollmentDesc")}
          actionHref="/classes"
          actionText={t("selectClass")}
          badgeVariant="muted"
        />
      )
    }

    const { status, class: cls } = activeEnrollment
    const classNameTitle = cls?.title || t("className")
    const termText = cls?.term?.title || ""

    let statusText = ""
    let description = ""
    let badgeVariant: "warning" | "success" | "destructive" | "info" | "muted" =
      "warning"

    switch (status) {
      case ENROLLMENT_STATUSES.PENDING_PAYMENT:
        statusText = tEnrollments("status.PENDING_PAYMENT")
        description = tEnrollments("timer.warning")
        badgeVariant = "warning"
        break
      case ENROLLMENT_STATUSES.PENDING_APPROVAL:
        statusText = tEnrollments("status.PENDING_APPROVAL")
        description = t("receiptStatusDesc")
        badgeVariant = "warning"
        break
      case ENROLLMENT_STATUSES.ENROLLED:
        statusText = tEnrollments("status.ENROLLED")
        description = tEnrollments("statusCard.enrolledNotice")
        badgeVariant = "success"
        break
      case ENROLLMENT_STATUSES.WAITLISTED:
        statusText = tEnrollments("status.WAITLISTED")
        description = tEnrollments("statusCard.waitlistedNotice")
        badgeVariant = "info"
        break
      case ENROLLMENT_STATUSES.REJECTED:
        statusText = tEnrollments("status.REJECTED")
        description = tEnrollments("statusCard.rejectedNotice")
        badgeVariant = "destructive"
        break
      default:
        statusText = status
        description = ""
        badgeVariant = "muted"
    }

    return (
      <ActiveEnrollmentCard
        classNameTitle={classNameTitle}
        statusText={statusText}
        termText={termText}
        description={description}
        actionHref="/enrollments"
        badgeVariant={badgeVariant}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <QuickActionCard
          href="/classes"
          title={t("allowedClasses")}
          description={t("allowedClassesDesc")}
          icon={Layers}
          iconBgClassName="bg-primary/10"
          iconColorClassName="text-primary"
        />

        <QuickActionCard
          href="/flashcards"
          title={t("flashcards")}
          description={t("flashcardsDesc")}
          icon={Sparkles}
          iconBgClassName="bg-success/10"
          iconColorClassName="text-success"
        />
      </div>

      {/* Active Enrollment Status Card */}
      {renderEnrollmentCard()}
    </div>
  )
}
