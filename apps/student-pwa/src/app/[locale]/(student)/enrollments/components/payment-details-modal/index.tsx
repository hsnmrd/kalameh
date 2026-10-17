"use client"

import * as React from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { ExternalLink } from "lucide-react"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
} from "@workspace/ui/components/dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Price } from "@workspace/ui/components/price"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import { ENROLLMENT_STATUSES, type EnrollmentDto } from "@workspace/types"

export interface PaymentDetailsModalProps {
  open: boolean
  enrollment: EnrollmentDto | null
  onClose: () => void
}

export function PaymentDetailsModal({
  open,
  enrollment,
  onClose,
}: PaymentDetailsModalProps) {
  const t = useTranslations("enrollments")
  const locale = useLocale()

  if (!enrollment) {
    return null
  }

  const status = enrollment.status
  const isPendingApproval = status === ENROLLMENT_STATUSES.PENDING_APPROVAL
  const isEnrolled = status === ENROLLMENT_STATUSES.ENROLLED
  const isRejected = status === ENROLLMENT_STATUSES.REJECTED

  const badgeVariant = isEnrolled
    ? "border-success/25 bg-success/10 text-success"
    : isPendingApproval
      ? "border-warning/25 bg-warning/10 text-warning"
      : isRejected
        ? "border-destructive/25 bg-destructive/10 text-destructive"
        : "border-primary/25 bg-primary/10 text-primary"

  const noticeText = isEnrolled
    ? t("statusCard.enrolledNotice")
    : isPendingApproval
      ? t("statusCard.pendingApprovalNotice")
      : isRejected
        ? t("statusCard.rejectedNotice")
        : t("statusCard.waitlistedNotice")

  const dateValue = enrollment.transaction?.paymentDate ?? enrollment.createdAt
  const formattedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
    { dateStyle: "medium" }
  ).format(new Date(dateValue))

  const amount = enrollment.transaction?.amount ?? enrollment.class?.fee
  const receiptUrl = enrollment.transaction?.receiptImageUrl
    ? getAssetUrl(enrollment.transaction.receiptImageUrl)
    : null

  return (
    <FormDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose()
        }
      }}
    >
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <FormDialogTitle className="text-base font-bold sm:text-lg">
              {t("detailsModal.title")}
            </FormDialogTitle>
            <Badge
              variant="outline"
              className={cn("font-semibold", badgeVariant)}
            >
              {t(`status.${status}`)}
            </Badge>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {noticeText && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 text-xs leading-relaxed text-muted-foreground">
              {noticeText}
            </div>
          )}

          <div className="flex flex-col divide-y divide-border/50 rounded-2xl border border-border/60 bg-card p-3.5 text-xs">
            <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
              <span className="text-muted-foreground">
                {t("detailsModal.class")}
              </span>
              <span className="font-semibold text-foreground">
                {enrollment.class?.title ?? "—"}
              </span>
            </div>

            {enrollment.class?.term?.title && (
              <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-muted-foreground">
                  {t("detailsModal.term")}
                </span>
                <span className="font-semibold text-foreground">
                  {enrollment.class.term.title}
                </span>
              </div>
            )}

            {enrollment.class?.teacherName && (
              <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-muted-foreground">
                  {t("detailsModal.teacher")}
                </span>
                <span className="font-semibold text-foreground">
                  {enrollment.class.teacherName}
                </span>
              </div>
            )}

            {amount !== undefined && (
              <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-muted-foreground">
                  {t("detailsModal.amount")}
                </span>
                <Price
                  amount={amount}
                  locale={locale}
                  className="font-bold text-foreground"
                />
              </div>
            )}

            <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
              <span className="text-muted-foreground">
                {t("detailsModal.date")}
              </span>
              <span className="font-medium text-foreground">
                {formattedDate}
              </span>
            </div>

            {enrollment.transaction?.trackingCode && (
              <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-muted-foreground">
                  {t("detailsModal.trackingCode")}
                </span>
                <span
                  dir="ltr"
                  className="font-sans font-semibold text-foreground select-all"
                >
                  {enrollment.transaction.trackingCode}
                </span>
              </div>
            )}
          </div>

          {receiptUrl ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {t("detailsModal.receiptImage")}
                </span>
                <Button
                  render={
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-xs text-primary hover:text-primary/80"
                >
                  <ExternalLink className="size-3.5" />
                  <span>{t("detailsModal.viewFullImage")}</span>
                </Button>
              </div>
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30">
                <Image
                  src={receiptUrl}
                  alt="Payment receipt"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          ) : null}
        </div>
      </FormDialogContent>
    </FormDialog>
  )
}
