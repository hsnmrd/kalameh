"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  Layers,
  Plus,
  Users,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Link, useIsRtl } from "@/i18n/routing"
import { useActiveInstitute } from "@/lib/stores"
import { authResource, institutesResource } from "@/lib/api"
import { StatCard } from "../stat-card"

export function InstituteAdminView() {
  const t = useTranslations("dashboard.instituteAdmin")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const { data: user } = useQuery(authResource.me.toQuery())
  const { activeInstitute, isSuperAdminManaging, clearActiveInstitute } =
    useActiveInstitute()

  const targetInstituteId = activeInstitute?.id || user?.instituteId

  const { data: instituteDetail } = useQuery({
    ...institutesResource.detail.toQuery(targetInstituteId!),
    enabled: Boolean(targetInstituteId),
  })

  const currentInstitute = instituteDetail ?? activeInstitute

  const classesCount = currentInstitute?.classesCount ?? 0
  const usersCount = currentInstitute?.usersCount ?? 0
  const instituteName = currentInstitute?.name ?? t("title")

  return (
    <div className="space-y-8">
      {/* Super Admin Active Institute Banner */}
      {isSuperAdminManaging && currentInstitute && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-emerald-950">
                  {t("managingBanner", { name: currentInstitute.name })}
                </h2>
                <Badge variant="success" className="text-[10px]">
                  {t("superAdminBadge")}
                </Badge>
              </div>
              <p className="font-mono text-xs text-emerald-700">
                {currentInstitute.subdomain}.kalameh.ir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearActiveInstitute}
              className="h-9 cursor-pointer gap-1.5 border-emerald-500/30 bg-background text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10"
            >
              <Globe className="size-3.5" />
              <span>{t("backToOverview")}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {instituteName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentInstitute
              ? t("instituteSubtitle", { name: currentInstitute.name })
              : t("subtitle")}
          </p>
        </div>

        <Link href="/classes">
          <Button
            size="auth"
            className="h-11 cursor-pointer gap-2 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span>{t("addClass")}</span>
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("stats.activeClasses")}
          value={classesCount.toString()}
          subtitle="Top Notch, Summit, Family & Friends"
          icon={Layers}
          iconBgClassName="bg-sky-500/10"
          iconColorClassName="text-sky-500"
          badgeText={t("activeClassesCount", { count: classesCount })}
          badgeVariant="info"
        />

        <StatCard
          title={t("stats.totalStudents")}
          value={usersCount.toString()}
          subtitle="Across all active classes"
          icon={Users}
          iconBgClassName="bg-emerald-500/10"
          iconColorClassName="text-emerald-500"
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
          iconBgClassName="bg-amber-500/10"
          iconColorClassName="text-amber-500"
          badgeText={t("stats.activeTerm")}
          badgeVariant="neutral"
        />
      </div>

      {/* Quick Classes Overview Card */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
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
                Top Notch 1A - Group A
              </p>
              <p className="text-xs text-muted-foreground">
                Instructor Mohammadi • 17:00 - 18:30
              </p>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              12 / 15 Enrolled
            </span>
          </div>

          <div className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">
                Summit 2B - Weekend Intensive
              </p>
              <p className="text-xs text-muted-foreground">
                Instructor Rezaei • Thu & Fri 09:00 - 12:00
              </p>
            </div>
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-600">
              18 / 20 Enrolled
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
