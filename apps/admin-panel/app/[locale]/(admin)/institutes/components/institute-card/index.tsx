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
        "flex flex-col justify-between space-y-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-xs transition-all",
        isSelected
          ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
          : "border-border hover:border-border/80"
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
                  : "bg-muted text-foreground"
              )}
            >
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="line-clamp-1 text-base font-bold text-foreground">
                {institute.name}
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
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
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="size-4 text-sky-500" />
            <span>
              <strong className="text-foreground">
                {institute.classesCount}
              </strong>{" "}
              {t("classesCount")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4 text-emerald-500" />
            <span>
              <strong className="text-foreground">
                {institute.usersCount}
              </strong>{" "}
              {t("usersCount")}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-border/60 pt-4">
        <Button
          type="button"
          variant={isSelected ? "secondary" : "default"}
          onClick={handleManage}
          className={cn(
            "h-10 w-full cursor-pointer justify-center gap-2 rounded-xl text-xs font-semibold",
            isSelected
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
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
