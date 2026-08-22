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
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Link, useIsRtl } from "@/i18n/routing"
import { useActiveInstitute } from "@/lib/stores"
import { StatCard } from "../stat-card"

export function SuperAdminView() {
  const t = useTranslations("dashboard.superAdmin")
  const isRtl = useIsRtl()
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight

  const { institutes, isLoadingInstitutes, selectInstitute } =
    useActiveInstitute()

  const totalInstitutes = institutes.length
  const activeTenants = institutes.filter((i) => i.isActive).length

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
          value={totalInstitutes.toString()}
          subtitle={t("stats.total")}
          icon={Building2}
          iconBgClassName="bg-blue-50"
          iconColorClassName="text-blue-600"
          badgeText={`${totalInstitutes} Institutes`}
          badgeVariant="info"
        />

        <StatCard
          title={t("stats.activeTenants")}
          value={activeTenants.toString()}
          subtitle={
            totalInstitutes > 0
              ? `${Math.round((activeTenants / totalInstitutes) * 100)}% Active`
              : "100% Active"
          }
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

      {/* Institutes Quick Access Card */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t("recentInstitutes")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("recentInstitutesHint")}
            </p>
          </div>
          <Link
            href="/institutes"
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 transition-colors hover:text-black"
          >
            <span>{t("viewAll")}</span>
            <ActionArrow className="size-3.5" />
          </Link>
        </div>

        {isLoadingInstitutes ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner className="size-6 text-slate-700" />
          </div>
        ) : institutes.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            {t("noInstitutes")}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {institutes.slice(0, 5).map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => selectInstitute(inst)}
                className="-mx-2 flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-3.5 text-start transition-colors hover:bg-slate-50/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-800">
                    {inst.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {inst.name}
                    </p>
                    <p className="font-mono text-xs text-slate-400">
                      {inst.subdomain}.kalameh.ir
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={
                      inst.isActive
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
                        : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                    }
                  >
                    {inst.isActive ? "Active" : "Inactive"} •{" "}
                    {inst.classesCount} Classes
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <span>{t("enterPanel")}</span>
                    <ChevronIcon className="size-4 text-slate-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
