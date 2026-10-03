"use client"

import { useTranslations } from "next-intl"
import {
  CalendarCheck,
  CalendarOff,
  CalendarPlus,
  CalendarX,
  Info,
  Play,
  Trash2,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { DayActionsState } from "../hooks/use-day-actions-state"
import type { DayActionsPopoverProps } from "../types"

interface Props {
  state: DayActionsState
  actions: Pick<
    DayActionsPopoverProps,
    | "onOpenChange"
    | "onSetStartDate"
    | "onToggleHoliday"
    | "onToggleCustomOffDay"
    | "onOpenCompensatoryModal"
    | "onRemoveCompensatorySession"
    | "readOnly"
  >
}

export function DayActionButtons({ state, actions }: Props) {
  const t = useTranslations("terms")
  if (actions.readOnly) return null
  if (state.isBelongingToOtherTerm) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-muted-foreground/20 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="size-4 shrink-0 text-muted-foreground" />
        <span>
          {t("batchModal.referenceTermNotice", {
            title: state.clickedProposal?.title || "",
          })}
        </span>
      </div>
    )
  }
  const hasActions =
    !state.isStartDate ||
    state.isOfficialHoliday ||
    Boolean(actions.onToggleCustomOffDay) ||
    state.canShowCompensatory
  if (!hasActions) return null

  return (
    <div className="flex flex-col gap-2">
      {!state.isStartDate && (
        <Button
          type="button"
          variant="outline"
          disabled={!state.canSetStart}
          onClick={() => {
            actions.onSetStartDate?.(state.activeTermIndex, state.ymd)
            actions.onOpenChange(false)
          }}
          className="h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium"
        >
          <Play className="size-4 text-foreground" />
          <span>
            {t("batchModal.actionSetStart")}{" "}
            {state.activeProposal?.title
              ? `(${state.activeProposal.title})`
              : ""}
          </span>
        </Button>
      )}
      {state.isOfficialHoliday && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            actions.onToggleHoliday?.(state.ymd)
            actions.onOpenChange(false)
          }}
          className="h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium"
        >
          {state.isDismissed ? (
            <CalendarCheck className="size-4 text-foreground" />
          ) : (
            <CalendarX className="size-4 text-foreground" />
          )}
          <span>
            {state.isDismissed
              ? t("batchModal.actionRestoreHoliday")
              : t("batchModal.actionDismissHoliday")}
          </span>
        </Button>
      )}
      {!state.isOfficialHoliday && actions.onToggleCustomOffDay && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            actions.onToggleCustomOffDay?.(state.ymd)
            actions.onOpenChange(false)
          }}
          className={cn(
            "h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium",
            state.isCustomOff &&
              "border-destructive/30 text-destructive hover:bg-destructive/10"
          )}
        >
          {state.isCustomOff ? (
            <Trash2 className="size-4 text-destructive" />
          ) : (
            <CalendarOff className="size-4 text-foreground" />
          )}
          <span>
            {state.isCustomOff
              ? t("batchModal.actionRemoveCustomOffDay")
              : t("batchModal.actionAddCustomOffDay")}
          </span>
        </Button>
      )}
      {state.canShowCompensatory &&
        (state.currentCompensatory ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              actions.onRemoveCompensatorySession?.(
                state.currentCompensatory!.termIndex,
                state.ymd
              )
              actions.onOpenChange(false)
            }}
            className="h-11 w-full justify-start gap-2.5 rounded-xl border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4 text-destructive" />
            <span>{t("batchModal.actionRemoveCompensatory")}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={!state.canAddCompensatory}
            onClick={() => {
              actions.onOpenChange(false)
              actions.onOpenCompensatoryModal?.(
                state.activeTermIndex,
                state.ymd,
                state.isExcessSessionDay ? state.oppositeTrack : undefined
              )
            }}
            className="h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium"
          >
            <CalendarPlus className="size-4 text-foreground" />
            <span className="truncate">
              {state.isExcessSessionDay
                ? t("batchModal.actionAddCompensatoryForOpposite", {
                    track:
                      state.oppositeTrack === "EVEN"
                        ? t("batchModal.patternEvenShort")
                        : t("batchModal.patternOddShort"),
                  })
                : t("batchModal.actionAddCompensatory")}
            </span>
          </Button>
        ))}
    </div>
  )
}
