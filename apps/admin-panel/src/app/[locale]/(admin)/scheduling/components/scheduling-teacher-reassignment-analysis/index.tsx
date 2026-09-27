"use client"

import { useLocale, useTranslations } from "next-intl"
import { ArrowRightLeft, ShieldCheck } from "lucide-react"
import type { SchedulingTeacherReassignmentChain } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingTeacherReassignmentAnalysisProps {
  chains: SchedulingTeacherReassignmentChain[]
  targetCourseTitle: string
}

export function SchedulingTeacherReassignmentAnalysis({
  chains,
  targetCourseTitle,
}: SchedulingTeacherReassignmentAnalysisProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()

  return (
    <section
      aria-label={t("reassignment.title")}
      className="rounded-xl border border-border p-3.5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <ArrowRightLeft
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-foreground"
          />
          <div>
            <h5 className="text-xs font-semibold text-foreground">
              {t("reassignment.title")}
            </h5>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              {t("reassignment.description")}
            </p>
          </div>
        </div>
        {chains.length > 0 && (
          <Badge variant="success">
            {t("reassignment.chainCount", {
              count: formatNumber(chains.length, locale),
            })}
          </Badge>
        )}
      </div>

      {chains.length === 0 ? (
        <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2.5">
          <p className="text-xs font-semibold text-foreground">
            {t("reassignment.noChainTitle")}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("reassignment.noChainDescription")}
          </p>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {chains.map((chain) => {
            const target = chain.targetAssignment
            const targetTeacher = `${target.teacher.firstName} ${target.teacher.lastName}`
            const targetDays = target.daysOfWeek
              .map((day) => t(`weekDays.${day}`))
              .join(t("daySeparator"))

            return (
              <li key={chain.key} className="rounded-xl bg-muted/40 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    {t("reassignment.validatedChain")}
                  </p>
                  <Badge variant="secondary">
                    {t("reassignment.changeCount", {
                      count: formatNumber(chain.reassignments.length, locale),
                    })}
                  </Badge>
                </div>

                <ol className="mt-3 flex flex-col gap-2">
                  {chain.reassignments.map((step, index) => {
                    const fromTeacher = `${step.fromTeacher.firstName} ${step.fromTeacher.lastName}`
                    const toTeacher = `${step.toTeacher.firstName} ${step.toTeacher.lastName}`
                    const days = step.daysOfWeek
                      .map((day) => t(`weekDays.${day}`))
                      .join(t("daySeparator"))

                    return (
                      <li
                        key={step.proposalId}
                        className="grid grid-cols-[auto_1fr] items-start gap-2.5 rounded-lg bg-background px-3 py-2.5"
                      >
                        <Badge variant="outline">
                          {formatNumber(index + 1, locale)}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">
                            {t("reassignment.moveTeacher", {
                              classTitle: step.classTitle,
                              fromTeacher,
                              toTeacher,
                            })}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {days} · {step.startTime}–{step.endTime}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                  <li className="grid grid-cols-[auto_1fr] items-start gap-2.5 rounded-lg bg-background px-3 py-2.5">
                    <Badge variant="success">
                      {formatNumber(chain.reassignments.length + 1, locale)}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {t("reassignment.assignTarget", {
                          course: targetCourseTitle,
                          teacher: targetTeacher,
                        })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {targetDays} · {target.startTime}–{target.endTime}
                        {" · "}
                        {target.deliveryMode === "ONLINE"
                          ? t("reassignment.online")
                          : t("reassignment.room", {
                              room:
                                target.classroom?.name ??
                                t("recovery.unknownPhysicalRoom"),
                            })}
                      </p>
                    </div>
                  </li>
                </ol>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <ShieldCheck
                    aria-hidden
                    className="size-4 text-muted-foreground"
                  />
                  <Badge variant="outline">
                    {t("reassignment.validation.qualification")}
                  </Badge>
                  <Badge variant="outline">
                    {t("reassignment.validation.availability")}
                  </Badge>
                  <Badge variant="outline">
                    {t("reassignment.validation.teacherConflicts")}
                  </Badge>
                  <Badge variant="outline">
                    {t("reassignment.validation.room")}
                  </Badge>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
