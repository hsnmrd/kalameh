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
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Link href="/institutes">
          <Button
            size="auth"
            className="h-11 cursor-pointer gap-2 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
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
          iconBgClassName="bg-sky-500/10"
          iconColorClassName="text-sky-500"
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
          iconBgClassName="bg-emerald-500/10"
          iconColorClassName="text-emerald-500"
          badgeText={t("stats.active")}
          badgeVariant="success"
        />

        <StatCard
          title={t("stats.systemHealth")}
          value="99.99%"
          subtitle="All microservices operational"
          icon={Activity}
          iconBgClassName="bg-purple-500/10"
          iconColorClassName="text-purple-500"
          badgeText={t("stats.healthy")}
          badgeVariant="success"
        />
      </div>

      {/* Institutes Quick Access Card */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t("recentInstitutes")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("recentInstitutesHint")}
            </p>
          </div>
          <Link
            href="/institutes"
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>{t("viewAll")}</span>
            <ActionArrow className="size-3.5" />
          </Link>
        </div>

        {isLoadingInstitutes ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner className="size-6 text-foreground" />
          </div>
        ) : institutes.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("noInstitutes")}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {institutes.slice(0, 5).map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => selectInstitute(inst)}
                className="-mx-2 flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-3.5 text-start transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted font-bold text-foreground">
                    {inst.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {inst.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {inst.subdomain}.kalameh.ir
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={
                      inst.isActive
                        ? "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600"
                        : "rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600"
                    }
                  >
                    {inst.isActive ? t("stats.active") : t("stats.inactive")}
                  </span>
                  <ActionArrow className="size-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
