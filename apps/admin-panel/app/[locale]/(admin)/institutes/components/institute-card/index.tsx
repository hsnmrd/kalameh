"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Users,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import type { InstituteWithStats } from "@workspace/types"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter, useIsRtl } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"

export interface InstituteCardProps {
  institute: InstituteWithStats
}

export function InstituteCard({ institute }: InstituteCardProps) {
  const t = useTranslations("institutes")
  const isRtl = useIsRtl()
  const router = useRouter()
  const { activeInstitute, selectInstitute } = useActiveInstitute()

  const isSelected = activeInstitute?.id === institute.id
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const handleManage = () => {
    selectInstitute(institute)
    router.push("/")
  }

  return (
    <div
      className={cn(
        "flex flex-col justify-between space-y-4 rounded-2xl border bg-white p-6 shadow-xs transition-all",
        isSelected
          ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="space-y-4">
        {/* Header with Name and Subdomain */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-xl text-sm font-bold",
                isSelected
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="line-clamp-1 text-base font-bold text-slate-900">
                {institute.name}
              </h2>
              <span className="font-mono text-xs text-slate-400">
                {institute.subdomain}.kalameh.ir
              </span>
            </div>
          </div>

          <Badge
            variant={institute.isActive ? "success" : "secondary"}
            className="text-[11px]"
          >
            {institute.isActive ? t("status.active") : t("status.inactive")}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Layers className="size-4 text-blue-500" />
            <span>
              <strong>{institute.classesCount}</strong> {t("classesCount")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="size-4 text-emerald-500" />
            <span>
              <strong>{institute.usersCount}</strong> {t("usersCount")}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant={isSelected ? "secondary" : "default"}
          onClick={handleManage}
          className={cn(
            "h-10 w-full cursor-pointer justify-center gap-2 rounded-xl text-xs font-semibold",
            isSelected
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "bg-slate-900 text-white hover:bg-slate-800"
          )}
        >
          {isSelected ? (
            <>
              <Check className="size-4 text-emerald-600" />
              <span>{t("currentlyManaging")}</span>
            </>
          ) : (
            <>
              <span>{t("manageInstitute")}</span>
              <ActionArrow className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
