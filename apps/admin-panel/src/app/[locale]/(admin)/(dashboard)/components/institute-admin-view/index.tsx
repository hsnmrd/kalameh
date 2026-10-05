"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Layers, Users, Calendar, ArrowRight, ArrowLeft } from "lucide-react"
import { Link, useIsRtl } from "@/i18n/routing"
import { useActiveInstitute } from "@/lib/stores"
import { authResource, institutesResource } from "@/lib/api"
import { StatCard } from "../stat-card"
import { SetupFlow } from "../setup-flow"

export function InstituteAdminView() {
  const t = useTranslations("dashboard.instituteAdmin")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const { data: user } = useQuery(authResource.me.toQuery())
  const { activeInstitute } = useActiveInstitute()

  const targetInstituteId = activeInstitute?.id || user?.instituteId

  const { data: instituteDetail } = useQuery({
    ...institutesResource.detail.toQuery(targetInstituteId!),
    enabled: Boolean(targetInstituteId),
  })

  const currentInstitute = instituteDetail ?? activeInstitute

  const classesCount = instituteDetail?.classesCount ?? 0
  const usersCount = instituteDetail?.usersCount ?? 0
  const instituteName = currentInstitute?.name ?? t("title")

  return (
    <div className="flex flex-col gap-8">
      {/* Institute Setup & Academic Cycle Workflow */}
      {targetInstituteId && (
        <SetupFlow
          instituteId={targetInstituteId}
          classesCount={classesCount}
        />
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("stats.activeClasses")}
          value={classesCount.toString()}
          subtitle={t("stats.courseFamilies")}
          icon={Layers}
          iconBgClassName="bg-primary/10"
          iconColorClassName="text-primary"
          badgeText={t("activeClassesCount", { count: classesCount })}
          badgeVariant="info"
        />

        <StatCard
          title={t("stats.totalStudents")}
          value={usersCount.toString()}
          subtitle={t("stats.studentsScope")}
          icon={Users}
          iconBgClassName="bg-success/10"
          iconColorClassName="text-success"
          badgeText={
            usersCount > 0
              ? t("enrolledCount", { count: usersCount })
              : t("noUsers")
          }
          badgeVariant={usersCount > 0 ? "success" : "neutral"}
        />

        <StatCard
          title={t("stats.termCapacity")}
          value={t("stats.occupancy")}
          subtitle={t("stats.activeTerm")}
          icon={Calendar}
          iconBgClassName="bg-warning/10"
          iconColorClassName="text-warning"
          badgeText={t("stats.activeTerm")}
          badgeVariant="neutral"
        />
      </div>

      {/* Quick Classes Overview Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            {t("recentClasses")}
          </h2>
          <Link
            href="/classes"
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>{t("viewAll")}</span>
            <ActionArrow className="size-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-border/60">
          <div className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">
                {t("preview.first.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("preview.first.schedule")}
              </p>
            </div>
            <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              {t("preview.first.enrollment")}
            </span>
          </div>

          <div className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">
                {t("preview.second.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("preview.second.schedule")}
              </p>
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {t("preview.second.enrollment")}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
