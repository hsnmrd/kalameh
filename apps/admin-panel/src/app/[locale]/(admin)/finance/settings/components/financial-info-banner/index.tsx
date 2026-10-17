"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Landmark, Info } from "lucide-react"

export function FinancialInfoBanner() {
  const t = useTranslations("transactions.settings")

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-start sm:p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Landmark className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <Info className="size-4 text-primary" />
          <span>{t("infoTitle")}</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {t("infoDescription")}
        </p>
      </div>
    </div>
  )
}
