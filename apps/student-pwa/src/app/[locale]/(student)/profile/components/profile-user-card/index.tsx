"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Phone, ShieldCheck } from "lucide-react"

export interface ProfileUserCardProps {
  initial: string
  fullName: string
  phone: string
  role: string
  isActive: boolean
}

export function ProfileUserCard({
  initial,
  fullName,
  phone,
  role,
  isActive,
}: ProfileUserCardProps) {
  const t = useTranslations("profile")

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-xs">
          {initial}
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {fullName}
          </h2>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3.5" />
            <span>{phone}</span>
          </p>
        </div>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t("accountRole")}</span>
          <span className="font-semibold text-foreground">{role}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>{t("accountStatus")}</span>
          <span className="flex items-center gap-1 font-semibold text-emerald-600">
            <ShieldCheck className="size-3.5" />
            <span>{isActive ? t("active") : t("suspended")}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
