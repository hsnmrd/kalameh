"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertTriangle, Eye, ReceiptText } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import type { TransactionDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { DataTable } from "@workspace/ui/components/data-table"
import { Price } from "@workspace/ui/components/price"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { TransactionStatusBadge } from "../transaction-status-badge"

export interface TransactionsTableProps {
  transactions: TransactionDto[] | undefined
  isLoading: boolean
  onReview: (transaction: TransactionDto) => void
}

export function TransactionsTable({
  transactions,
  isLoading,
  onReview,
}: TransactionsTableProps) {
  const t = useTranslations("transactions")
  const locale = useLocale()
  const columns = React.useMemo<ColumnDef<TransactionDto>[]>(
    () => [
      {
        id: "student",
        header: t("table.student"),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">
              {row.original.student.firstName} {row.original.student.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.student.phone}
            </span>
          </div>
        ),
      },
      {
        id: "class",
        header: t("table.class"),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">
              {row.original.class?.title ?? "—"}
            </span>
            {row.original.class?.term?.title && (
              <span className="text-xs text-muted-foreground">
                {row.original.class.term.title}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "trackingCode",
        header: t("table.trackingCode"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-foreground">
              {row.original.trackingCode}
            </span>
            {row.original.isDuplicateTrackingCode && (
              <span
                className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-xs font-semibold text-warning"
                title={t("table.duplicateWarning")}
              >
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>{t("table.duplicateWarning")}</span>
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: t("table.amount"),
        cell: ({ row }) => (
          <Price amount={row.original.amount} locale={locale} />
        ),
      },
      {
        accessorKey: "paymentDate",
        header: t("table.paymentDate"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat(
              locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
              { dateStyle: "medium" }
            ).format(new Date(row.original.paymentDate))}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: t("table.status"),
        cell: ({ row }) => (
          <TransactionStatusBadge status={row.original.status} />
        ),
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReview(row.original)}
            >
              <Eye data-icon="inline-start" />
              {t("table.review")}
            </Button>
          </div>
        ),
      },
    ],
    [locale, onReview, t]
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!transactions?.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <ReceiptText />
          </EmptyMedia>
          <EmptyTitle>{t("title")}</EmptyTitle>
          <EmptyDescription>{t("table.empty")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return <DataTable columns={columns} data={transactions} />
}
