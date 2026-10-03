"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertCircle,
  CalendarDays,
  CircleCheckBig,
  Clock3,
  DoorOpen,
  Globe,
  ShieldAlert,
  User,
} from "lucide-react"
import type {
  SchedulingPlanDetailsDto,
  SchedulingPlanValidation,
} from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
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
  const tPlanDetails = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  const proposalsById = React.useMemo(
    () => new Map(proposals.map((proposal) => [proposal.id, proposal])),
    [proposals]
  )

  const validatedAt = new Intl.DateTimeFormat(
    locale.toLowerCase().startsWith("fa") ? "fa-IR-u-ca-persian" : "en-US",
    { dateStyle: "medium", timeStyle: "short" }
  ).format(new Date(result.validatedAt))

  const handleScrollToClass = (proposalId: string) => {
    if (typeof document === "undefined") return
    const el =
      document.querySelector(`[data-class-id="${proposalId}"]`) ||
      document.querySelector(
        `[data-testid="calendar-class-card-${proposalId}"]`
      )
    if (el) {
      el.scrollIntoView?.({ behavior: "smooth", block: "center" })
      el.classList.add(
        "ring-4",
        "ring-destructive",
        "transition-all",
        "duration-300"
      )
      setTimeout(() => {
        el.classList.remove("ring-4", "ring-destructive")
      }, 2500)
    } else {
      const calendarEl = document.getElementById("plan-proposals-title")
      calendarEl?.scrollIntoView?.({ behavior: "smooth" })
    }
  }

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
        <ul className="mt-4 flex flex-col gap-3">
          {result.violations.map((violation, index) => {
            const proposal = violation.proposalId
              ? proposalsById.get(violation.proposalId)
              : null

            return (
              <li
                key={`${violation.code}-${violation.proposalId ?? "plan"}-${index}`}
                data-testid={`violation-item-${violation.proposalId ?? "plan"}`}
                className="rounded-xl border border-border/80 bg-background p-4 shadow-2xs"
              >
                {proposal ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">
                            {proposal.course?.title ?? proposal.title}
                          </h4>
                          {proposal.title &&
                            proposal.course?.title &&
                            proposal.title !== proposal.course.title && (
                              <Badge
                                variant="secondary"
                                className="text-xs font-normal"
                              >
                                {proposal.title}
                              </Badge>
                            )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleScrollToClass(proposal.id)}
                        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <CalendarDays
                          aria-hidden
                          className="size-3.5 text-muted-foreground"
                        />
                        <span>{t("viewInCalendar")}</span>
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock3
                          aria-hidden
                          className="size-3.5 text-muted-foreground"
                        />
                        <span className="font-medium text-foreground">
                          {proposal.daysOfWeek
                            .map((day) => tPlanDetails(`weekDays.${day}`))
                            .join(tPlanDetails("daySeparator"))}
                        </span>
                        <span>·</span>
                        <span>
                          {tPlanDetails("timeRange", {
                            start: proposal.startTime,
                            end: proposal.endTime,
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <User
                          aria-hidden
                          className="size-3.5 text-muted-foreground"
                        />
                        <span>
                          {proposal.teacher
                            ? `${t("teacher")}: ${proposal.teacher.firstName} ${proposal.teacher.lastName}`
                            : t("noTeacher")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {proposal.deliveryMode === "ONLINE" ? (
                          <>
                            <Globe
                              aria-hidden
                              className="size-3.5 text-muted-foreground"
                            />
                            <span>{t("online")}</span>
                          </>
                        ) : (
                          <>
                            <DoorOpen
                              aria-hidden
                              className="size-3.5 text-muted-foreground"
                            />
                            <span>
                              {[proposal.branch?.name, proposal.classroom?.name]
                                .filter(Boolean)
                                .join(" · ") || t("notSpecified")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-foreground">
                      {violation.proposalId
                        ? t("unknownProposal")
                        : t("wholePlan")}
                    </h4>
                  </div>
                )}

                <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                    />
                    <p className="text-sm leading-6 font-medium">
                      {t(`violations.${violation.code}`)}
                    </p>
                  </div>
                  {violation.conflictingEntityIds.length > 0 && (
                    <p className="mt-1.5 ps-6 text-xs text-muted-foreground">
                      {t("relatedConflicts", {
                        count: formatNumber(
                          violation.conflictingEntityIds.length,
                          locale
                        ),
                      })}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
