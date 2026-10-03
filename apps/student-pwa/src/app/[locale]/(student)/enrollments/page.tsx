"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ReceiptStatusCard } from "./components/receipt-status-card"
import { UploadReceiptCard } from "./components/upload-receipt-card"

export default function StudentEnrollmentsPage() {
  const t = useTranslations("enrollments")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-4">
        <ReceiptStatusCard
          classNameTitle={t("className")}
          statusText={t("statusPending")}
          receiptNumber={t("receiptNumber")}
          submittedTime={t("submittedTime")}
          amount={t("amount")}
          trackingCode={t("trackingCodeValue")}
        />

        <UploadReceiptCard />
      </div>
    </div>
  )
}
