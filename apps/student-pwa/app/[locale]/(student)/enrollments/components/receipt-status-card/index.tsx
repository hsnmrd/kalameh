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
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
          {statusText}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {receiptNumber}
        </span>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground">
          {classNameTitle}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{submittedTime}</p>
        <p className="mt-1 font-mono text-xs text-foreground/80">{amount}</p>
      </div>

      <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {t("trackingCodeLabel")}
        </span>{" "}
        {trackingCode}
      </div>
    </div>
  )
}
