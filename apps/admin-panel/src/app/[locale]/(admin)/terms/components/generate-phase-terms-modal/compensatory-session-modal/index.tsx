"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { CalendarPlus, Calendar } from "lucide-react"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select"
import {
  gregorianToJalali,
  formatJalali,
  type GeneratedTermProposal,
  type CompensatorySession,
  type HolidayEncountered,
} from "@workspace/types"

export interface CompensatorySessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetDate: string
  termIndex: number
  termProposal?: GeneratedTermProposal
  onSave: (termIndex: number, session: CompensatorySession) => void
  locale?: "fa" | "en"
}

export function CompensatorySessionModal({
  open,
  onOpenChange,
  targetDate,
  termIndex,
  termProposal,
  onSave,
  locale = "fa",
}: CompensatorySessionModalProps) {
  const t = useTranslations("terms")

  const [patternTrack, setPatternTrack] = React.useState<"ODD" | "EVEN">("ODD")
  const [replacesDate, setReplacesDate] = React.useState<string>("NONE")

  // Format the target date nicely in Jalali
  const formattedTargetDate = React.useMemo(() => {
    if (!targetDate) return ""
    try {
      const gDate = new Date(targetDate + "T12:00:00")
      const j = gregorianToJalali(gDate)
      return formatJalali(j.year, j.month, j.day)
    } catch {
      return targetDate
    }
  }, [targetDate])

  // Get list of holidays encountered in this term proposal
  const holidays: HolidayEncountered[] = termProposal?.holidaysEncountered ?? []

  // Auto-detect track if a holiday is selected
  const handleHolidaySelect = (value: string | null) => {
    const selected = value ?? "NONE"
    setReplacesDate(selected)
    if (selected !== "NONE") {
      const matched = holidays.find((h) => h.date === selected)
      if (matched) {
        if (
          matched.dayOfWeek === "SUNDAY" ||
          matched.dayOfWeek === "TUESDAY" ||
          matched.dayOfWeek === "THURSDAY"
        ) {
          setPatternTrack("ODD")
        } else if (
          matched.dayOfWeek === "SATURDAY" ||
          matched.dayOfWeek === "MONDAY" ||
          matched.dayOfWeek === "WEDNESDAY"
        ) {
          setPatternTrack("EVEN")
        }
      }
    }
  }

  const handleSave = () => {
    if (!targetDate) return
    onSave(termIndex, {
      date: targetDate,
      patternTrack,
      replacesDate: replacesDate !== "NONE" ? replacesDate : undefined,
    })
    onOpenChange(false)
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-5 text-foreground" />
            <span>{t("batchModal.compensatoryModalTitle")}</span>
          </FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("batchModal.compensatoryModalDesc")}
          </p>

          {/* Target Date Display */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3.5">
            <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
              <Calendar className="size-4 text-muted-foreground" />
              <span>{t("batchModal.compensatoryDate")}</span>
            </div>
            <span className="font-semibold text-foreground">
              {formattedTargetDate}
            </span>
          </div>

          {/* Pattern Track Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("batchModal.patternSelect")}
            </label>
            <Select
              value={patternTrack}
              onValueChange={(val) => {
                if (val === "ODD" || val === "EVEN") {
                  setPatternTrack(val)
                }
              }}
            >
              <SelectTrigger className="h-14 rounded-2xl text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ODD">
                  {t("batchModal.patternSelectOdd")}
                </SelectItem>
                <SelectItem value="EVEN">
                  {t("batchModal.patternSelectEven")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Replaced Holiday Selection (Optional) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              {t("batchModal.replacesHolidayLabel")}
            </label>
            <Select value={replacesDate} onValueChange={handleHolidaySelect}>
              <SelectTrigger className="h-14 rounded-2xl text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">
                  {t("batchModal.noHolidaysToSelect")}
                </SelectItem>
                {holidays.map((h) => (
                  <SelectItem key={h.date} value={h.date}>
                    {locale === "fa" ? h.titleFa : h.titleEn} ({h.dateJalali})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="mt-2 flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-14 flex-1 rounded-2xl text-base"
            >
              {t("batchModal.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="h-14 flex-1 rounded-2xl text-base font-semibold"
            >
              {t("batchModal.saveCompensatory")}
            </Button>
          </div>
        </div>
      </FormDialogContent>
    </FormDialog>
  )
}
