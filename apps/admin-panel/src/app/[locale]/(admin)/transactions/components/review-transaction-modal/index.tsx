"use client"

import Image from "next/image"
import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Check, X } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  PERMISSIONS,
  TRANSACTION_STATUSES,
  type TransactionDto,
  type TransactionStatus,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { Price } from "@workspace/ui/components/price"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/sonner"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { transactionsResource } from "@/lib/api"
import { TransactionStatusBadge } from "../transaction-status-badge"

export interface ReviewTransactionModalProps {
  transaction: TransactionDto | null
  onClose: () => void
}

export function ReviewTransactionModal({
  transaction,
  onClose,
}: ReviewTransactionModalProps) {
  const t = useTranslations("transactions.reviewModal")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [receiptState, setReceiptState] = React.useState<
    "loading" | "loaded" | "error"
  >("loading")
  const [receiptAttempt, setReceiptAttempt] = React.useState(0)
  const updateStatus = useMutation({
    ...transactionsResource.updateStatus.toMutation(),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: transactionsResource.list.baseKey(),
      })
      toast.success(
        updated.status === TRANSACTION_STATUSES.APPROVED
          ? t("approveSuccess")
          : t("rejectSuccess")
      )
      onClose()
    },
  })

  if (!transaction) return null

  const studentName = `${transaction.student.firstName} ${transaction.student.lastName}`
  const paymentDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
    { dateStyle: "long" }
  ).format(new Date(transaction.paymentDate))
  const handleStatusChange = (status: TransactionStatus) => {
    updateStatus.mutate({ id: transaction.id, body: { status } })
  }
  const receiptUrl = getAssetUrl(transaction.receiptImageUrl)
  const receiptSrc = receiptAttempt
    ? `${receiptUrl}${receiptUrl.includes("?") ? "&" : "?"}retry=${receiptAttempt}`
    : receiptUrl
  const pendingStatus = updateStatus.variables?.body.status

  return (
    <ResponsiveDialog open onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <div className="flex min-w-0 flex-col gap-1">
            <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t("description")}
            </ResponsiveDialogDescription>
          </div>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-6 pb-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
            <Image
              key={receiptAttempt}
              src={receiptSrc}
              alt={t("receiptAlt", { student: studentName })}
              fill
              sizes="(max-width: 640px) 100vw, 640px"
              className={
                receiptState === "loaded"
                  ? "object-contain opacity-100"
                  : "object-contain opacity-0"
              }
              unoptimized
              onLoad={() => setReceiptState("loaded")}
              onError={() => setReceiptState("error")}
            />
            {receiptState === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Spinner className="size-7" />
                <p className="text-sm">{t("receiptLoading")}</p>
              </div>
            )}
            {receiptState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  {t("receiptError")}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReceiptState("loading")
                    setReceiptAttempt((attempt) => attempt + 1)
                  }}
                >
                  {t("receiptRetry")}
                </Button>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t("student")}</dt>
              <dd className="font-semibold text-foreground">{studentName}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t("phone")}</dt>
              <dd className="font-mono font-medium text-foreground">
                {transaction.student.phone}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">
                {t("trackingCode")}
              </dt>
              <dd className="font-mono font-medium text-foreground">
                {transaction.trackingCode}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t("amount")}</dt>
              <dd className="font-semibold text-foreground">
                <Price amount={transaction.amount} locale={locale} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">
                {t("paymentDate")}
              </dt>
              <dd className="font-medium text-foreground">{paymentDate}</dd>
            </div>
            <div className="flex items-end">
              <TransactionStatusBadge status={transaction.status} />
            </div>
          </dl>
        </div>

        <ResponsiveDialogFooter className="gap-2 px-6 pb-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          <PermissionGuard
            permission={PERMISSIONS.MANAGE_TRANSACTIONS}
            mode="hide"
          >
            <Button
              type="button"
              variant="destructive"
              disabled={
                updateStatus.isPending ||
                receiptState !== "loaded" ||
                transaction.status === TRANSACTION_STATUSES.REJECTED
              }
              onClick={() => handleStatusChange(TRANSACTION_STATUSES.REJECTED)}
            >
              {updateStatus.isPending &&
              pendingStatus === TRANSACTION_STATUSES.REJECTED ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <X data-icon="inline-start" />
              )}
              {t("reject")}
            </Button>
            <Button
              type="button"
              disabled={
                updateStatus.isPending ||
                receiptState !== "loaded" ||
                transaction.status === TRANSACTION_STATUSES.APPROVED
              }
              onClick={() => handleStatusChange(TRANSACTION_STATUSES.APPROVED)}
            >
              {updateStatus.isPending &&
              pendingStatus === TRANSACTION_STATUSES.APPROVED ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Check data-icon="inline-start" />
              )}
              {t("approve")}
            </Button>
          </PermissionGuard>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
