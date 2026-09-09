"use client"

import { useLocale, useTranslations } from "next-intl"
import { CircleCheckBig, ShieldAlert } from "lucide-react"
import type {
  SchedulingPlanDetailsDto,
  SchedulingPlanValidation,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { cn, formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingPlanValidationResultProps {
  result: SchedulingPlanValidation
  proposals: SchedulingPlanDetailsDto["proposals"]
}

export function SchedulingPlanValidationResult({
  result,
  proposals,
}: SchedulingPlanValidationResultProps) {
  const t = useTranslations("scheduling.planValidation")
  const locale = useLocale()
  const proposalNames = new Map(
    proposals.map((proposal) => [proposal.id, proposal.title])
  )
  const validatedAt = new Intl.DateTimeFormat(
    locale.toLowerCase().startsWith("fa") ? "fa-IR-u-ca-persian" : "en-US",
    { dateStyle: "medium", timeStyle: "short" }
  ).format(new Date(result.validatedAt))

  return (
    <section
      aria-labelledby="plan-validation-title"
      aria-live="polite"
      className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div
          className={cn(
            "flex items-start gap-3",
            result.isValid ? "text-success" : "text-destructive"
          )}
        >
          {result.isValid ? (
            <CircleCheckBig aria-hidden className="mt-0.5 size-5" />
          ) : (
            <ShieldAlert aria-hidden className="mt-0.5 size-5" />
          )}
          <div>
            <h3 id="plan-validation-title" className="font-bold">
              {result.isValid ? t("validTitle") : t("invalidTitle")}
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("validatedAt", { date: validatedAt })}
            </p>
          </div>
        </div>
        <Badge variant={result.isValid ? "success" : "destructive"}>
          {result.isValid ? t("validBadge") : t("invalidBadge")}
        </Badge>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        {[
          {
            label: t("summary.proposals"),
            value: result.summary.proposalCount,
          },
          {
            label: t("summary.violations"),
            value: result.summary.violationCount,
          },
          {
            label: t("summary.invalidProposals"),
            value: result.summary.invalidProposalCount,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-background px-3 py-2.5"
          >
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 font-bold text-foreground">
              {formatNumber(item.value, locale)}
            </dd>
          </div>
        ))}
      </dl>

      {result.violations.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {result.violations.map((violation) => (
            <li
              key={JSON.stringify(violation)}
              className="rounded-xl bg-background p-3"
            >
              <p className="text-sm font-semibold text-foreground">
                {violation.proposalId
                  ? (proposalNames.get(violation.proposalId) ??
                    t("unknownProposal"))
                  : t("wholePlan")}
              </p>
              <p className="mt-1 text-sm leading-6 text-foreground">
                {t(`violations.${violation.code}`)}
              </p>
              {violation.conflictingEntityIds.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("relatedConflicts", {
                    count: formatNumber(
                      violation.conflictingEntityIds.length,
                      locale
                    ),
                  })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
