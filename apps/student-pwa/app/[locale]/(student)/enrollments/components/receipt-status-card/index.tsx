"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

export interface ReceiptStatusCardProps {
  classNameTitle: string
  statusText: string
  receiptNumber: string
  submittedTime: string
  amount: string
  trackingCode: string
}

export function ReceiptStatusCard({
  classNameTitle,
  statusText,
  receiptNumber,
  submittedTime,
  amount,
  trackingCode,
}: ReceiptStatusCardProps) {
  const t = useTranslations("enrollments")

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          {statusText}
        </span>
        <span className="font-mono text-xs text-slate-400">
          {receiptNumber}
        </span>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">
          {classNameTitle}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{submittedTime}</p>
        <p className="mt-1 font-mono text-xs text-slate-600">{amount}</p>
      </div>

      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        <span className="font-medium text-slate-700">
          {t("trackingCodeLabel")}
        </span>{" "}
        {trackingCode}
      </div>
    </div>
  )
}
