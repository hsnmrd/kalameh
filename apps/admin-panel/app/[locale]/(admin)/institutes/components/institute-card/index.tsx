"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Users,
  Phone,
  MapPin,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import type { InstituteWithStats } from "@workspace/types"
import { useActiveInstitute } from "@/lib/stores"
import { useRouter, useIsRtl } from "@/i18n/routing"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

export interface InstituteCardProps {
  institute: InstituteWithStats
}

export function InstituteCard({ institute }: InstituteCardProps) {
  const t = useTranslations("institutes")
  const locale = useLocale()
  const isRtl = useIsRtl()
  const router = useRouter()
  const { activeInstitute, selectInstitute } = useActiveInstitute()

  const isSelected = activeInstitute?.id === institute.id
  const ActionArrow = isRtl ? ArrowLeft : ArrowRight

  const handleManage = () => {
    selectInstitute(institute)
    router.push("/")
  }

  const brandColor = institute.primaryColor || null
  const hasPhones = institute.phones && institute.phones.length > 0

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
        {/* Header with Logo / Icon, Name, and Subdomain */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold shadow-2xs",
                isSelected
                  ? "bg-emerald-600 text-white"
                  : "bg-muted text-foreground"
              )}
              style={
                brandColor && !isSelected
                  ? {
                      backgroundColor: `${brandColor}15`,
                      color: brandColor,
                      borderColor: `${brandColor}40`,
                    }
                  : undefined
              }
            >
              {institute.logoUrl ? (
                <Image
                  src={institute.logoUrl}
                  alt={institute.name}
                  width={48}
                  height={48}
                  className="size-full object-contain p-1"
                  unoptimized
                />
              ) : (
                <Building2 className="size-6" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="line-clamp-1 text-base font-bold text-foreground">
                {institute.name}
              </h2>
              <span
                className="font-mono text-xs text-muted-foreground"
                dir="ltr"
              >
                {institute.subdomain}.kalameh.ir
              </span>
            </div>
          </div>

          <Badge
            variant={institute.isActive ? "success" : "secondary"}
            className="shrink-0 text-[11px]"
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
                {formatNumber(institute.classesCount, locale)}
              </strong>{" "}
              {t("classesCount")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-4 text-emerald-500" />
            <span>
              <strong className="text-foreground">
                {formatNumber(institute.usersCount, locale)}
              </strong>{" "}
              {t("usersCount")}
            </span>
          </div>
        </div>

        {/* Contact Snippet (Phones & Address) */}
        {(hasPhones || institute.address) && (
          <div className="space-y-1.5 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            {hasPhones && (
              <div
                className="flex items-center gap-2"
                dir={locale === "fa" ? "rtl" : "ltr"}
              >
                <Phone className="size-3.5 shrink-0 text-muted-foreground/70" />
                <span className="truncate font-mono text-[11px]">
                  {institute.phones.join(" • ")}
                </span>
              </div>
            )}
            {institute.address && (
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground/70" />
                <span className="line-clamp-1 text-[11px]">
                  {institute.address}
                </span>
              </div>
            )}
          </div>
        )}
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
