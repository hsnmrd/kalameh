"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Phone, Shield, Building2, CheckCircle2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { getAssetUrl } from "@workspace/ui/lib/utils"

export interface UserProfileDetailsProps {
  fullName: string
  phone?: string
  avatarUrl?: string | null
  initial: string
  roleLabel: string
  roleBadgeVariant: "default" | "secondary" | "warning" | "destructive"
  instituteName?: string
  isActive?: boolean
}

export function UserProfileDetails({
  fullName,
  phone,
  avatarUrl,
  initial,
  roleLabel,
  roleBadgeVariant,
  instituteName,
  isActive = true,
}: UserProfileDetailsProps) {
  const t = useTranslations("common")

  return (
    <div className="flex flex-col gap-3">
      {/* Header Info */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          {avatarUrl ? (
            <Image
              src={getAssetUrl(avatarUrl)}
              alt={fullName}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">
            {fullName}
          </p>
          {phone && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="size-3 shrink-0 text-muted-foreground" />
              <span dir="ltr" className="font-mono text-[11px]">
                {phone}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Details List */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="size-3.5 text-muted-foreground" />
            <span>{t("userProfile.role")}</span>
          </span>
          <Badge variant={roleBadgeVariant} className="px-2 py-0.5 text-[11px]">
            {roleLabel}
          </Badge>
        </div>

        {instituteName && (
          <div className="flex items-center justify-between py-0.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="size-3.5 text-muted-foreground" />
              <span>{t("userProfile.institute")}</span>
            </span>
            <span className="max-w-[140px] truncate font-medium text-foreground">
              {instituteName}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-muted-foreground" />
            <span>{t("userProfile.status")}</span>
          </span>
          <Badge
            variant={isActive ? "success" : "destructive"}
            className="px-2 py-0.5 text-[11px]"
          >
            {isActive ? t("userProfile.active") : t("userProfile.inactive")}
          </Badge>
        </div>
      </div>
    </div>
  )
}
