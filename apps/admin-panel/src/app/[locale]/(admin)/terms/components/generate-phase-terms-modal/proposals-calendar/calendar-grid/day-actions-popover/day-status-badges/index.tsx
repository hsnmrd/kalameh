"use client"

import { useTranslations } from "next-intl"
import { Star } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { formatNumber } from "@workspace/ui/lib/utils"
import type { DayActionsState } from "../hooks/use-day-actions-state"

export function DayStatusBadges({
  state,
  locale,
}: {
  state: DayActionsState
  locale: "fa" | "en"
}) {
  const t = useTranslations("terms")
  const isRegularDay =
    !state.isOfficialHoliday &&
    !state.isCustomOff &&
    !state.isFriday &&
    !state.hasCompensatory &&
    !state.isExcessSessionDay &&
    !state.isExamDay &&
    !state.isBelongingToOtherTerm &&
    !state.isCurrentTermStart &&
    !state.isCurrentTermEnd &&
    !state.isTermSessionDay
  return (
    <div className="flex flex-col gap-1.5 border-b border-border/60 pb-3">
      <span className="text-sm font-semibold text-foreground">
        {state.dateFormatted}
      </span>
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {state.isBelongingToOtherTerm && (
          <Badge className="bg-muted text-muted-foreground">
            {t("batchModal.statusReferenceTerm", {
              title: state.clickedProposal?.title || "",
            })}
          </Badge>
        )}
        {state.isCurrentTermStart && (
          <Badge className="bg-primary/15 text-primary">
            {t("batchModal.statusTermStart")}
          </Badge>
        )}
        {state.isCurrentTermEnd && (
          <Badge className="bg-primary/15 text-primary">
            {t("batchModal.statusTermEnd")}
          </Badge>
        )}
        {state.isOfficialHoliday && !state.isDismissed && (
          <Badge className="bg-destructive/15 text-destructive">
            {t("batchModal.statusOfficialHoliday", {
              title: state.holidayTitle || "",
            })}
          </Badge>
        )}
        {state.isOfficialHoliday && state.isDismissed && (
          <Badge className="bg-emerald-500/15 text-emerald-700">
            {t("batchModal.statusDismissedHoliday", {
              title: state.holidayTitle || "",
            })}
          </Badge>
        )}
        {state.isCustomOff && (
          <Badge className="bg-warning/15 text-warning">
            {t("batchModal.statusCustomOff", {
              title: state.holidayTitle || "",
            })}
          </Badge>
        )}
        {state.isFriday && !state.isOfficialHoliday && !state.isCustomOff && (
          <Badge className="bg-destructive/15 text-destructive">
            {t("batchModal.statusFriday")}
          </Badge>
        )}
        {state.currentCompensatory && (
          <Badge className="bg-primary/15 text-primary">
            {t("batchModal.statusCompensatory", {
              track:
                state.currentCompensatory.patternTrack === "EVEN"
                  ? t("batchModal.patternEvenShort")
                  : t("batchModal.patternOddShort"),
            })}
          </Badge>
        )}
        {state.isExcessSessionDay && !state.hasCompensatory && (
          <Badge className="bg-warning/15 text-warning">
            {t("batchModal.statusExcessSession", {
              track:
                state.excessPattern?.track === "EVEN"
                  ? t("batchModal.patternEvenShort")
                  : t("batchModal.patternOddShort"),
              num: formatNumber(state.excessSessionNum ?? 0, locale),
              target: formatNumber(
                state.excessPattern?.targetSessions ?? 18,
                locale
              ),
            })}
          </Badge>
        )}
        {state.isExamDay && (
          <Badge className="gap-1 bg-warning/15 text-warning">
            <Star className="size-3 fill-warning text-warning" />
            <span>
              {state.isEvenExam
                ? t("batchModal.statusEvenExamSession")
                : state.isOddExam
                  ? t("batchModal.statusOddExamSession")
                  : t("batchModal.statusExamSession")}
            </span>
          </Badge>
        )}
        {state.isTermSessionDay &&
          !state.isCurrentTermStart &&
          !state.isCurrentTermEnd &&
          !state.isExamDay &&
          !state.isExcessSessionDay &&
          !state.hasCompensatory && (
            <Badge className="bg-primary/10 text-foreground">
              {state.isEvenSession
                ? t("batchModal.patternEvenShort")
                : t("batchModal.patternOddShort")}
            </Badge>
          )}
        {isRegularDay && (
          <Badge className="bg-muted font-normal text-muted-foreground">
            {t("batchModal.statusRegularDay")}
          </Badge>
        )}
      </div>
    </div>
  )
}
