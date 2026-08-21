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
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          {statusText}
        </span>
        <span className="text-xs text-slate-400">{termText}</span>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          {classNameTitle}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <Link
        href={actionHref}
        className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-600 hover:text-black"
      >
        <span>{t("viewReceiptDetails")}</span>
        <DetailArrow className="size-3.5" />
      </Link>
    </div>
  )
}
