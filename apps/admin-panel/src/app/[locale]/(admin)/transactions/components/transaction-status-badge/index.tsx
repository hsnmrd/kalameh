"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"
import { TRANSACTION_STATUSES, type TransactionStatus } from "@workspace/types"

export interface TransactionStatusBadgeProps {
  status: TransactionStatus
}

export function TransactionStatusBadge({
  status,
}: TransactionStatusBadgeProps) {
  const t = useTranslations("transactions.status")

  if (status === TRANSACTION_STATUSES.APPROVED) {
    return <Badge variant="success">{t("approved")}</Badge>
  }

  if (status === TRANSACTION_STATUSES.REJECTED) {
    return <Badge variant="destructive">{t("rejected")}</Badge>
  }

  return (
    <Badge variant="warning" className="text-warning-foreground">
      {t("pending")}
    </Badge>
  )
}
