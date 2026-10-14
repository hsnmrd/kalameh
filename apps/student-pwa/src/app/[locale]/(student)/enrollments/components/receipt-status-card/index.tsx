"use client"

import Image from "next/image"
import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@workspace/ui/components/badge"
import { Price } from "@workspace/ui/components/price"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { ENROLLMENT_STATUSES, type EnrollmentDto } from "@workspace/types"

export interface ReceiptStatusCardProps {
  enrollment: EnrollmentDto
}

export function ReceiptStatusCard({ enrollment }: ReceiptStatusCardProps) {
  const t = useTranslations("enrollments")
  const locale = useLocale()

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

  const formattedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
    { dateStyle: "medium" }
  ).format(new Date(enrollment.createdAt))

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">
            {enrollment.class?.term?.title ?? "—"}
          </span>
          <h3 className="text-base font-bold text-foreground">
            {enrollment.class?.title ?? "—"}
          </h3>
        </div>

        <Badge variant="outline" className={`font-semibold ${badgeVariant}`}>
          {t(`status.${status}`)}
        </Badge>
      </div>

      <p className="rounded-xl bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
        {noticeText}
      </p>

      {/* Details dl */}
      <dl className="grid grid-cols-2 gap-3 text-xs">
        {enrollment.class?.fee !== undefined && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-[11px] text-muted-foreground">
              {t("statusCard.amountLabel")}
            </dt>
            <dd className="font-bold text-foreground">
              <Price amount={enrollment.class.fee} locale={locale} />
            </dd>
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] text-muted-foreground">
            {t("statusCard.dateLabel")}
          </dt>
          <dd className="font-medium text-foreground">{formattedDate}</dd>
        </div>

        {enrollment.transaction?.trackingCode && (
          <div className="col-span-2 flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
            <span className="text-[11px] text-muted-foreground">
              {t("statusCard.trackingCodeLabel")}
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {enrollment.transaction.trackingCode}
            </span>
          </div>
        )}
      </dl>

      {/* Receipt Image thumbnail if available */}
      {enrollment.transaction?.receiptImageUrl && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-muted">
          <Image
            src={getAssetUrl(enrollment.transaction.receiptImageUrl)}
            alt="Payment receipt"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}
    </div>
  )
}
