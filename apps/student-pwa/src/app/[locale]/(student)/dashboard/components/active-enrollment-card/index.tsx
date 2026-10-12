"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Link, useIsRtl } from "@/i18n/routing"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export interface ActiveEnrollmentCardProps {
  classNameTitle: string
  statusText?: string
  termText?: string
  description: string
  actionHref?: string
  actionText?: string
  badgeVariant?: "warning" | "success" | "destructive" | "info" | "muted"
}

export function ActiveEnrollmentCard({
  classNameTitle,
  statusText,
  termText,
  description,
  actionHref = "/enrollments",
  actionText,
  badgeVariant = "warning",
}: ActiveEnrollmentCardProps) {
  const t = useTranslations("dashboard")
  const isRtl = useIsRtl()
  const DetailArrow = isRtl ? ArrowLeft : ArrowRight

  const badgeVariantClasses = {
    warning: "border-warning/20 bg-warning/10 text-warning",
    success: "border-success/20 bg-success/10 text-success",
    destructive: "border-destructive/20 bg-destructive/10 text-destructive",
    info: "border-primary/20 bg-primary/10 text-primary",
    muted: "border-border bg-muted text-muted-foreground",
  }[badgeVariant]

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
      {(statusText || termText) && (
        <div className="flex items-center justify-between">
          {statusText ? (
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                badgeVariantClasses
              )}
            >
              {statusText}
            </span>
          ) : (
            <span />
          )}
          {termText ? (
            <span className="text-xs text-muted-foreground">{termText}</span>
          ) : null}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {classNameTitle}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Link
        href={actionHref}
        className="flex items-center justify-between border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <span>{actionText || t("viewReceiptDetails")}</span>
        <DetailArrow className="size-3.5" />
      </Link>
    </div>
  )
}
