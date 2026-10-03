"use client"

import { useLocale, useTranslations } from "next-intl"
import { CircleCheckBig } from "lucide-react"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatDate, formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingPlanPublicationStatusProps {
  plan: SchedulingPlanDetailsDto
}

export function SchedulingPlanPublicationStatus({
  plan,
}: SchedulingPlanPublicationStatusProps) {
  const t = useTranslations("scheduling.planPublication")
  const locale = useLocale()

  return (
    <section
      aria-labelledby="plan-publication-title"
      aria-live="polite"
      className="rounded-2xl border border-success/30 bg-success/10 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 text-success">
          <CircleCheckBig aria-hidden className="mt-0.5 size-5" />
          <div>
            <h3 id="plan-publication-title" className="font-bold">
              {t("published.title")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-foreground">
              {t("published.description", {
                count: formatNumber(plan.proposals.length, locale),
              })}
            </p>
            {plan.publishedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("published.at", {
                  date: formatDate(plan.publishedAt, locale),
                })}
              </p>
            )}
          </div>
        </div>
        <Badge variant="success">{t("published.badge")}</Badge>
      </div>
    </section>
  )
}
