"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Price } from "@workspace/ui/components/price"
import { cn } from "@workspace/ui/lib/utils"
import { useIsRtl } from "@/i18n/routing"
import { ENROLLMENT_STATUSES, type EnrollmentDto } from "@workspace/types"

export interface ReceiptStatusCardProps {
  enrollment: EnrollmentDto
  onClick?: () => void
}

export function ReceiptStatusCard({
  enrollment,
  onClick,
}: ReceiptStatusCardProps) {
  const t = useTranslations("enrollments")
  const locale = useLocale()
  const isRtl = useIsRtl()
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight

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

  const dateValue = enrollment.transaction?.paymentDate ?? enrollment.createdAt
  const formattedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
    { dateStyle: "medium" }
  ).format(new Date(dateValue))

  const amount = enrollment.transaction?.amount ?? enrollment.class?.fee

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      className="group cursor-pointer rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-border hover:bg-muted/30 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs text-muted-foreground">
            {enrollment.class?.term?.title ?? "—"}
          </span>
          <h3 className="mt-0.5 truncate text-sm font-bold text-foreground">
            {enrollment.class?.title ?? "—"}
          </h3>
        </div>

        <Badge
          variant="outline"
          className={cn("shrink-0 font-semibold", badgeVariant)}
        >
          {t(`status.${status}`)}
        </Badge>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs">
        <div className="flex items-center gap-2">
          {amount !== undefined && (
            <Price
              amount={amount}
              locale={locale}
              className="font-bold text-foreground"
            />
          )}
          <span className="text-[11px] text-muted-foreground">•</span>
          <span className="text-[11px] text-muted-foreground">
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
          <span>{t("viewDetails")}</span>
          <ChevronIcon className="size-4" />
        </div>
      </div>
    </Card>
  )
}
