"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Layers,
  Plus,
  Users,
  Calendar,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Link, useIsRtl } from "@/i18n/routing"
import { StatCard } from "../stat-card"

export function InstituteAdminView() {
  const t = useTranslations("dashboard.instituteAdmin")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>

        <Link href="/classes">
          <Button
            size="auth"
            className="h-11 cursor-pointer gap-2 rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800"
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
          value="24"
          subtitle="Top Notch, Summit, Family & Friends"
          icon={Layers}
          iconBgClassName="bg-blue-50"
          iconColorClassName="text-blue-600"
          badgeText="24 Active"
          badgeVariant="info"
        />

        <StatCard
          title={t("stats.totalStudents")}
          value="342"
          subtitle="Across all active classes"
          icon={Users}
          iconBgClassName="bg-emerald-50"
          iconColorClassName="text-emerald-600"
          badgeText="+18 This Week"
          badgeVariant="success"
        />

        <StatCard
          title={t("stats.termCapacity")}
          value={t("stats.occupancy")}
          subtitle={t("stats.activeTerm")}
          icon={Calendar}
          iconBgClassName="bg-amber-50"
          iconColorClassName="text-amber-600"
          badgeText={t("stats.activeTerm")}
          badgeVariant="neutral"
        />
      </div>

      {/* Quick Classes Overview Card */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {t("recentClasses")}
          </h2>
          <Link
            href="/classes"
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-black"
          >
            <span>{t("viewAll")}</span>
            <ActionArrow className="size-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-semibold text-slate-900">
                Top Notch 1A - Group A
              </p>
              <p className="text-xs text-slate-500">
                Instructor Mohammadi • 17:00 - 18:30
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              12 / 15 Enrolled
            </span>
          </div>

          <div className="flex items-center justify-between py-3 text-sm">
            <div>
              <p className="font-semibold text-slate-900">
                Summit 2B - Weekend Intensive
              </p>
              <p className="text-xs text-slate-500">
                Instructor Rezaei • Thu & Fri 09:00 - 12:00
              </p>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              18 / 20 Enrolled
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
