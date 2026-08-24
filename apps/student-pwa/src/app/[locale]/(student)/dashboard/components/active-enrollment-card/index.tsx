"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Link, useIsRtl } from "@/i18n/routing"
import { ArrowRight, ArrowLeft } from "lucide-react"

export interface ActiveEnrollmentCardProps {
  classNameTitle: string
  statusText: string
  termText: string
  description: string
  actionHref?: string
}

export function ActiveEnrollmentCard({
  classNameTitle,
  statusText,
  termText,
  description,
  actionHref = "/enrollments",
}: ActiveEnrollmentCardProps) {
  const t = useTranslations("dashboard")
  const isRtl = useIsRtl()
  const DetailArrow = isRtl ? ArrowLeft : ArrowRight

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">
          {statusText}
        </span>
        <span className="text-xs text-muted-foreground">{termText}</span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {classNameTitle}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Link
        href={actionHref}
        className="flex items-center justify-between border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <span>{t("viewReceiptDetails")}</span>
        <DetailArrow className="size-3.5" />
      </Link>
    </div>
  )
}
