"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Check, ShieldCheck } from "lucide-react"
import type { SchedulingTeacherReassignmentChain } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"

export interface ReassignmentChainCardProps {
  chain: SchedulingTeacherReassignmentChain
  targetCourseTitle: string
  canApply: boolean
  isPending: boolean
  isApplying: boolean
  onApply: (chain: SchedulingTeacherReassignmentChain) => void
}

export function ReassignmentChainCard({
  chain,
  targetCourseTitle,
  canApply,
  isPending,
  isApplying,
  onApply,
}: ReassignmentChainCardProps) {
  const t = useTranslations("scheduling.planDetails")
  const locale = useLocale()
  const target = chain.targetAssignment
  const targetTeacher = `${target.teacher.firstName} ${target.teacher.lastName}`
  const targetDays = target.daysOfWeek
    .map((day) => t(`weekDays.${day}`))
    .join(t("daySeparator"))

  return (
    <div
      data-testid={`reassignment-chain-card-${chain.key}`}
      className="flex h-full flex-col justify-between rounded-xl bg-muted/40 p-3.5"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-foreground">
              {t("reassignment.validatedChain")}
            </p>
            <Badge variant="secondary">
              {t("reassignment.changeCount", {
                count: formatNumber(chain.reassignments.length, locale),
              })}
            </Badge>
          </div>
          {canApply && (
            <Button
              type="button"
              size="sm"
              data-testid={`apply-reassignment-chain-btn-${chain.key}`}
              disabled={isPending}
              onClick={() => onApply(chain)}
              className="gap-1.5 font-medium"
            >
              {isApplying ? (
                <Spinner className="size-3.5" />
              ) : (
                <>
                  <Check aria-hidden className="size-3.5" />
                  <span>{t("reassignment.applyChainButton")}</span>
                </>
              )}
            </Button>
          )}
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
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <ShieldCheck aria-hidden className="size-4 text-muted-foreground" />
        <Badge variant="outline">
          {t("reassignment.validation.qualification")}
        </Badge>
        <Badge variant="outline">
          {t("reassignment.validation.availability")}
        </Badge>
        <Badge variant="outline">
          {t("reassignment.validation.teacherConflicts")}
        </Badge>
        <Badge variant="outline">{t("reassignment.validation.room")}</Badge>
      </div>
    </div>
  )
}
