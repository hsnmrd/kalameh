"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { Link, useIsRtl } from "@/i18n/routing"
import { Button } from "@workspace/ui/components/button"

export function GradesHeader() {
  const t = useTranslations("grades")
  const isRtl = useIsRtl()
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-2">
          <Link href="/classes">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 p-0 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowIcon className="size-3.5" />
              <span>{t("backToClasses")}</span>
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>
    </div>
  )
}
