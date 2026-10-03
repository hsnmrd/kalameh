"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { Popover, PopoverContent } from "@workspace/ui/components/popover"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { gregorianToJalali } from "@workspace/types"
import { normalizeDateToYmd } from "../../helper/calendar-colors"
import { DayActionButtons } from "./day-action-buttons"
import { DayStatusBadges } from "./day-status-badges"
import { useDayActionsState } from "./hooks/use-day-actions-state"
import type { DayActionsPopoverProps } from "./types"

export type { DayActionsPopoverProps } from "./types"

export function DayActionsPopover(props: DayActionsPopoverProps) {
  const t = useTranslations("terms")
  const isMobile = useIsMobile()
  const state = useDayActionsState(props)
  const resolvedAnchor = React.useCallback(() => {
    if (props.anchorEl?.isConnected) return props.anchorEl
    if (typeof document !== "undefined" && props.date) {
      const dateKeys = [
        normalizeDateToYmd(props.date),
        (() => {
          const jalali = gregorianToJalali(props.date!)
          return `${jalali.year}-${String(jalali.month).padStart(2, "0")}-${String(jalali.day).padStart(2, "0")}`
        })(),
      ]
      for (const dateKey of dateKeys) {
        const cell = document.querySelector(`[data-day="${dateKey}"]`)
        const button = (
          cell?.matches("button") ? cell : cell?.querySelector("button")
        ) as HTMLElement | null
        if (button?.isConnected) return button
      }
    }
    return props.anchorEl
  }, [props.anchorEl, props.date])

  if (!props.date) return null

  const content = (
    <div className="flex flex-col gap-3.5">
      <DayStatusBadges state={state} locale={props.locale ?? "fa"} />
      <DayActionButtons
        state={state}
        actions={{
          onOpenChange: props.onOpenChange,
          onSetStartDate: props.onSetStartDate,
          onToggleHoliday: props.onToggleHoliday,
          onToggleCustomOffDay: props.onToggleCustomOffDay,
          onOpenCompensatoryModal: props.onOpenCompensatoryModal,
          onRemoveCompensatorySession: props.onRemoveCompensatorySession,
          readOnly: props.readOnly,
        }}
      />
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={props.open} onOpenChange={props.onOpenChange}>
        <DrawerContent className="p-4">
          <DrawerHeader className="p-0 pb-2">
            <DrawerTitle className="text-sm font-semibold">
              {t("batchModal.dayActionsTitle", { date: state.jalaliDay })}
            </DrawerTitle>
            <DrawerCloseButton />
          </DrawerHeader>
          <div className="pt-2">{content}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={props.open} onOpenChange={props.onOpenChange}>
      <PopoverContent
        anchor={resolvedAnchor}
        side="bottom"
        align="center"
        sideOffset={6}
        className="w-80 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}
