"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Phone } from "lucide-react"

export interface ProfileContactCardProps {
  phone: string
  emergencyPhone?: string | null
  address?: string | null
}

export function ProfileContactCard({
  phone,
  emergencyPhone,
  address,
}: ProfileContactCardProps) {
  const t = useTranslations("profile")

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground">
        <Phone className="size-4 text-muted-foreground" />
        <span>{t("contactInfo")}</span>
      </h3>

      <div className="grid grid-cols-1 gap-3.5 pt-1 text-xs sm:grid-cols-2 sm:text-sm">
        <div>
          <span className="text-xs text-muted-foreground">{t("phone")}</span>
          <p className="mt-1 font-medium text-foreground">
            <span dir="ltr">{phone}</span>
          </p>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">
            {t("emergencyPhone")}
          </span>
          <p className="mt-1 font-medium text-foreground">
            <span dir="ltr">{emergencyPhone || "—"}</span>
          </p>
        </div>

        {address && (
          <div className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">
              {t("address")}
            </span>
            <p className="mt-1 font-medium text-foreground">{address}</p>
          </div>
        )}
      </div>
    </div>
  )
}
