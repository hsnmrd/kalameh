"use client"

import { useLocale, useTranslations } from "next-intl"
import { ReceiptText } from "lucide-react"
import type { TransactionDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  MobileList,
  MobileListItemContent,
  MobileListItemIcon,
  MobileListItemTrailing,
} from "@workspace/ui/components/mobile-list"
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
    <MobileList>
      {transactions.map((transaction, index) => (
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
              primary={`${transaction.student.firstName} ${transaction.student.lastName}`}
              secondary={<Price amount={transaction.amount} locale={locale} />}
            />
            <MobileListItemTrailing>
              <TransactionStatusBadge status={transaction.status} />
            </MobileListItemTrailing>
          </Button>
          {index !== transactions.length - 1 && (
            <div className="ms-[4.5rem] h-px bg-border/60" aria-hidden />
          )}
        </div>
      ))}
    </MobileList>
  )
}
