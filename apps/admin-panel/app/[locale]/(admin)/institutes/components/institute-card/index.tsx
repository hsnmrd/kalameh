"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Building2, CheckCircle2 } from "lucide-react"

export interface InstituteCardProps {
  name: string
  subdomain: string
  isActive: boolean
  classesCount: number
}

export function InstituteCard({
  name,
  subdomain,
  isActive,
  classesCount,
}: InstituteCardProps) {
  const t = useTranslations("institutes")

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Building2 className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{name}</h2>
            <span className="font-mono text-xs text-slate-400">
              {subdomain}
            </span>
          </div>
        </div>
        {isActive && <CheckCircle2 className="size-5 text-emerald-500" />}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>{isActive ? t("status.active") : t("status.inactive")}</span>
        <span>{classesCount} Classes</span>
      </div>
    </div>
  )
}
