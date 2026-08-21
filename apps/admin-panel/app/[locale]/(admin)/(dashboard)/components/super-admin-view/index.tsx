"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Building2,
  Plus,
  ShieldCheck,
  Activity,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Link, useIsRtl } from "@/i18n/routing"
import { StatCard } from "../stat-card"

export function SuperAdminView() {
  const t = useTranslations("dashboard.superAdmin")
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

        <Link href="/institutes">
          <Button
            size="auth"
            className="h-11 cursor-pointer gap-2 rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800"
          >
            <Plus className="size-4" />
            <span>{t("createInstitute")}</span>
          </Button>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("stats.totalInstitutes")}
          value="12"
          subtitle={t("stats.total")}
          icon={Building2}
          iconBgClassName="bg-blue-50"
          iconColorClassName="text-blue-600"
          badgeText="12 Institutes"
          badgeVariant="info"
        />

        <StatCard
          title={t("stats.activeTenants")}
          value="11"
          subtitle="91.6% Active"
          icon={ShieldCheck}
          iconBgClassName="bg-emerald-50"
          iconColorClassName="text-emerald-600"
          badgeText={t("stats.active")}
          badgeVariant="success"
        />

        <StatCard
          title={t("stats.systemHealth")}
          value="99.99%"
          subtitle="All microservices operational"
          icon={Activity}
          iconBgClassName="bg-purple-50"
          iconColorClassName="text-purple-600"
          badgeText={t("stats.healthy")}
          badgeVariant="success"
        />
      </div>

      {/* Quick Institutes Overview Card */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {t("recentInstitutes")}
          </h2>
          <Link
            href="/institutes"
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-black"
          >
            <span>{t("viewAll")}</span>
            <ActionArrow className="size-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-700">
                آم
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  آموزشگاه مرکزی تهران
                </p>
                <p className="font-mono text-xs text-slate-400">
                  tehran.kalameh.ir
                </p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Active • 24 Classes
            </span>
          </div>

          <div className="flex items-center justify-between py-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-700">
                شی
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  آموزشگاه زبان شیراز
                </p>
                <p className="font-mono text-xs text-slate-400">
                  shiraz.kalameh.ir
                </p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              Active • 18 Classes
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
