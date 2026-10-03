import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarCheck, CalendarX, ChevronDown, Coffee } from "lucide-react"
import type {
  PhaseBreakInfo,
  PhaseGeneratedSlot,
  TeacherAvailabilityInput,
  WeekDay,
} from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"
import { cn } from "@workspace/ui/lib/utils"
import { SlotCarousel } from "./slot-carousel"

export interface TrackSlotRowProps {
  trackTitle: string
  trackSubtitle?: string
  days: WeekDay[]
  slots: PhaseGeneratedSlot[]
  breakInfo?: PhaseBreakInfo
  value: TeacherAvailabilityInput[]
  onToggleSlot: (days: WeekDay[], slot: PhaseGeneratedSlot) => void
  onSelectAllTrack: (days: WeekDay[], slots: PhaseGeneratedSlot[]) => void
  onClearTrack: (days: WeekDay[]) => void
  disabled?: boolean
  defaultOpen?: boolean
}

export function TrackSlotRow({
  trackTitle,
  trackSubtitle,
  days,
  slots,
  breakInfo,
  value,
  onToggleSlot,
  onSelectAllTrack,
  onClearTrack,
  disabled = false,
  defaultOpen = true,
}: TrackSlotRowProps) {
  const t = useTranslations("teachers.availabilities")
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const isSlotSelected = React.useCallback(
    (slot: PhaseGeneratedSlot) =>
      days.length > 0 &&
      days.every((day) =>
        value.some(
          (item) =>
            item.dayOfWeek === day &&
            item.startTime === slot.startTime &&
            item.endTime === slot.endTime
        )
      ),
    [days, value]
  )

  const isAllSelected =
    slots.length > 0 && slots.every((slot) => isSlotSelected(slot))

  const hasAnySelected = slots.some((slot) =>
    days.some((day) =>
      value.some(
        (item) =>
          item.dayOfWeek === day &&
          item.startTime === slot.startTime &&
          item.endTime === slot.endTime
      )
    )
  )

  const selectedClassesCount = React.useMemo(() => {
    return slots.filter((slot) => isSlotSelected(slot)).length
  }, [slots, isSlotSelected])

  const hasBreak = Boolean(
    breakInfo?.hasBreak && breakInfo.startTime && breakInfo.endTime
  )

  const { shift1Slots, shift2Slots } = React.useMemo(() => {
    if (!hasBreak) {
      return { shift1Slots: slots, shift2Slots: [] }
    }
    const s1 = slots.filter((s) => s.shift === 1)
    const s2 = slots.filter((s) => s.shift === 2)
    if (s1.length > 0 || s2.length > 0) {
      return { shift1Slots: s1, shift2Slots: s2 }
    }
    if (breakInfo?.startTime && breakInfo?.endTime) {
      return {
        shift1Slots: slots.filter((s) => s.endTime <= breakInfo.startTime!),
        shift2Slots: slots.filter((s) => s.startTime >= breakInfo.endTime!),
      }
    }
    return { shift1Slots: slots, shift2Slots: [] }
  }, [slots, hasBreak, breakInfo])

  const showBreakSection =
    hasBreak && shift1Slots.length > 0 && shift2Slots.length > 0

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-2xs transition-colors"
    >
      <div
        className="flex cursor-pointer flex-wrap items-center justify-between gap-2 transition-colors select-none"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {trackTitle}
          </span>
          {trackSubtitle && (
            <span className="text-xs text-muted-foreground">
              ({trackSubtitle})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isOpen &&
            (selectedClassesCount > 0 ? (
              <div className="flex items-center gap-1.5 rounded-xl bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                <CalendarCheck className="size-3.5 shrink-0 text-primary" />
                <span>
                  {t("trackCollapsedCount", { count: selectedClassesCount })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                <CalendarX className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{t("trackCollapsedEmpty")}</span>
              </div>
            ))}

          {isOpen && (
            <>
              {hasAnySelected && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearTrack(days)
                  }}
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                >
                  {t("clearAllSlots")}
                </Button>
              )}
              {!isAllSelected && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectAllTrack(days, slots)
                  }}
                  className="h-7 px-2.5 text-xs text-muted-foreground hover:text-primary"
                >
                  {t("selectAllSlots")}
                </Button>
              )}
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen((prev) => !prev)
            }}
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? t("collapseTrack") : t("expandTrack")}
            title={isOpen ? t("collapseTrack") : t("expandTrack")}
          >
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-250",
                isOpen && "rotate-180"
              )}
            />
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        <div className="mt-3 border-t border-border/60 pt-3.5">
          {showBreakSection ? (
            <div className="flex flex-col gap-3">
              <SlotCarousel
                trackTitle={`${trackTitle}-shift1`}
                slots={shift1Slots}
                days={days}
                isSlotSelected={isSlotSelected}
                onToggleSlot={onToggleSlot}
                disabled={disabled}
              />

              <div className="flex items-center gap-2.5 py-1">
                <div className="h-px flex-1 bg-border/60" />
                <div className="flex items-center gap-1.5 rounded-full border border-dashed border-border/80 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                  <Coffee className="size-3 text-muted-foreground" />
                  <span>
                    {t("breakBanner", {
                      start: breakInfo?.startTime ?? "",
                      end: breakInfo?.endTime ?? "",
                    })}
                  </span>
                </div>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <SlotCarousel
                trackTitle={`${trackTitle}-shift2`}
                slots={shift2Slots}
                days={days}
                isSlotSelected={isSlotSelected}
                onToggleSlot={onToggleSlot}
                disabled={disabled}
              />
            </div>
          ) : (
            <SlotCarousel
              trackTitle={trackTitle}
              slots={slots}
              days={days}
              isSlotSelected={isSlotSelected}
              onToggleSlot={onToggleSlot}
              disabled={disabled}
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
