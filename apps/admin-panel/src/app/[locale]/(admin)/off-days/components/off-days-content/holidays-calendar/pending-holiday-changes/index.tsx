"use client"

import { useTranslations } from "next-intl"
import { Undo2 } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export interface PendingHolidayChange {
  date: string
  willBeOpen: boolean
}

export interface PendingHolidayChangesProps {
  changes: PendingHolidayChange[]
  locale: "fa" | "en"
  onUndo: (date: string) => void
}

function formatDate(dateIso: string, locale: "fa" | "en"): string {
  return new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  ).format(new Date(`${dateIso}T12:00:00`))
}

export function PendingHolidayChanges({
  changes,
  locale,
  onUndo,
}: PendingHolidayChangesProps) {
  const t = useTranslations("setting.offDays")

  return (
    <section
      aria-labelledby="pending-holiday-changes-title"
      className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-3"
    >
      <div className="flex flex-col gap-0.5">
        <h3
          id="pending-holiday-changes-title"
          className="text-sm font-semibold text-foreground"
        >
          {t("selectedDates", { count: changes.length })}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("selectedDatesDescription")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {changes.map((change) => {
          const displayDate = formatDate(change.date, locale)
          return (
            <div
              key={change.date}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2"
            >
              <span className="text-xs font-medium text-foreground">
                {displayDate}
              </span>
              <Badge variant={change.willBeOpen ? "success" : "destructive"}>
                {change.willBeOpen
                  ? t("changeToWorkingDay")
                  : t("changeToOfficialHoliday")}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={t("undoDateChange", { date: displayDate })}
                onClick={() => onUndo(change.date)}
                className="cursor-pointer text-muted-foreground"
              >
                <Undo2 />
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
