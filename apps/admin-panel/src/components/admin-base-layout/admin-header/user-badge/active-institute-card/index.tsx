"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Building2, X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"

export interface ActiveInstituteCardProps {
  name: string
  subdomain: string
  logoUrl?: string | null
  primaryColor?: string | null
  onChangeInstitute: () => void
  onCloseInstitute: () => void
}

export function ActiveInstituteCard({
  name,
  subdomain,
  logoUrl,
  primaryColor,
  onChangeInstitute,
  onCloseInstitute,
}: ActiveInstituteCardProps) {
  const t = useTranslations("common")
  const initial = name ? name.slice(0, 2) : "IN"

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-3">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "relative flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold shadow-xs",
            !primaryColor && "bg-emerald-600 text-white"
          )}
          style={
            primaryColor
              ? { backgroundColor: primaryColor, color: "#ffffff" }
              : undefined
          }
        >
          {logoUrl ? (
            <Image
              src={getAssetUrl(logoUrl)}
              alt={name}
              fill
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground">{name}</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {subdomain}.kalameh.ir
          </p>
        </div>
        <Badge variant="success" className="shrink-0 px-1.5 py-0 text-[10px]">
          {t("userProfile.managingInstitute")}
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onChangeInstitute}
          className="h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-border text-xs font-medium text-foreground hover:bg-muted active:scale-95"
        >
          <Building2 className="size-3.5 text-muted-foreground" />
          <span>{t("userProfile.changeInstitute")}</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCloseInstitute}
          className="h-8 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95"
        >
          <X className="size-3.5" />
          <span>{t("userProfile.closeInstitute")}</span>
        </Button>
      </div>
    </div>
  )
}
