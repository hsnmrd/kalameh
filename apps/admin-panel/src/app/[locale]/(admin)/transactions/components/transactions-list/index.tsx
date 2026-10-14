"use client"

import { useLocale, useTranslations } from "next-intl"
import { AlertTriangle, ReceiptText } from "lucide-react"
import type { TransactionDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  MobileList,
  MobileListItemContent,
  MobileListItemIcon,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
import { DataPagination } from "@workspace/ui/components/pagination"
import { useClientPagination } from "@/lib/hooks"
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

export interface TransactionsListProps {
  transactions: TransactionDto[] | undefined
  isLoading: boolean
  onReview: (transaction: TransactionDto) => void
}

export function TransactionsList({
  transactions,
  isLoading,
  onReview,
}: TransactionsListProps) {
  const t = useTranslations("transactions")
  const locale = useLocale()

  const { pageIndex, setPageIndex, paginatedData } = useClientPagination({
    data: transactions,
    pageSize: 10,
  })

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
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

  return (
    <>
      <MobileList>
        {paginatedData.map((transaction, index) => (
          <div key={transaction.id} role="listitem">
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-h-16 w-full justify-start gap-3.5 rounded-none px-4 py-3 text-start hover:bg-muted/30 active:bg-muted/50"
              aria-label={t("table.reviewTransaction", {
                student: `${transaction.student.firstName} ${transaction.student.lastName}`,
              })}
              onClick={() => onReview(transaction)}
            >
              <MobileListItemIcon>
                <ReceiptText />
              </MobileListItemIcon>
              <MobileListItemContent
                primary={
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">
                      {transaction.student.firstName}{" "}
                      {transaction.student.lastName}
                    </span>
                    {transaction.class?.title && (
                      <span className="text-xs text-muted-foreground">
                        {transaction.class.title}
                      </span>
                    )}
                  </div>
                }
                secondary={
                  <div className="flex items-center gap-2 pt-0.5">
                    <Price amount={transaction.amount} locale={locale} />
                    {transaction.isDuplicateTrackingCode && (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning"
                        title={t("table.duplicateWarning")}
                      >
                        <AlertTriangle className="size-3" />
                        <span>{t("table.duplicateWarning")}</span>
                      </span>
                    )}
                  </div>
                }
              />
              <MobileListItemTrailing>
                <TransactionStatusBadge status={transaction.status} />
              </MobileListItemTrailing>
            </Button>
            {index !== paginatedData.length - 1 && (
              <div className="ms-[4.5rem] h-px bg-border/60" aria-hidden />
            )}
          </div>
        ))}
      </MobileList>

      {transactions.length > 10 && (
        <div className="pt-4 pb-2">
          <DataPagination
            pageIndex={pageIndex}
            pageSize={10}
            totalItems={transactions.length}
            onPageChange={setPageIndex}
            compact
            locale={locale}
          />
        </div>
      )}
    </>
  )
}
