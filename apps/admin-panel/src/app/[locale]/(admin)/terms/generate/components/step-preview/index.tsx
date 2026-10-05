"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import type {
  GeneratedTermProposal,
  CompensatorySession,
} from "@workspace/types"
import { ProposalsCalendar } from "../../../components/proposals-calendar"
import { ProposalsTable } from "../proposals-table"

export interface StepPreviewProps {
  proposals: GeneratedTermProposal[]
  viewMode: "calendar" | "table"
  onViewModeChange: (mode: "calendar" | "table") => void
  onTitleChange: (index: number, newTitle: string) => void
  onStartDateChange: (index: number, newStartDate: string) => void
  onToggleHoliday?: (dateYmd: string) => void
  onToggleCustomOffDay?: (dateYmd: string) => void
  onAddCompensatorySession?: (
    termIndex: number,
    session: CompensatorySession
  ) => void
  onRemoveCompensatorySession?: (termIndex: number, dateYmd: string) => void
  locale?: "fa" | "en"
  observeOfficialHolidays?: boolean
  customOffDays?: string[]
  activeDismissedHolidays?: string[]
  compensatorySessions?: Record<number, CompensatorySession[]>
  onBack: () => void
  onSubmit: () => void
  isSubmitDisabled: boolean
  isSubmitLoading: boolean
}

export function StepPreview({
  proposals,
  viewMode,
  onViewModeChange,
  onTitleChange,
  onStartDateChange,
  onToggleHoliday,
  onToggleCustomOffDay,
  onAddCompensatorySession,
  onRemoveCompensatorySession,
  locale,
  observeOfficialHolidays,
  customOffDays,
  activeDismissedHolidays,
  compensatorySessions,
  onBack,
  onSubmit,
  isSubmitDisabled,
  isSubmitLoading,
}: StepPreviewProps) {
  const t = useTranslations("terms")

  const [selectedTermIndex, setSelectedTermIndex] = React.useState<number>(0)
  const safeSelectedTermIndex =
    selectedTermIndex >= proposals.length && proposals.length > 0
      ? 0
      : selectedTermIndex
  const activeTerm = proposals[safeSelectedTermIndex]

  return (
    <div className="flex flex-col gap-5">
      {/* Step Header & Controls Card */}
      <section className="rounded-2xl border border-border bg-card p-4 shadow-2xs sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:text-sm">
            {t("batchModal.dateShiftHint")}
          </p>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
            <Button
              type="button"
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("calendar")}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold"
            >
              <CalendarIcon className="size-3.5" />
              <span>{t("batchModal.calendarView")}</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("table")}
              className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold"
            >
              <TableIcon className="size-3.5" />
              <span>{t("batchModal.tableView")}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Active Term Session Imbalance Warning Alert */}
      {activeTerm?.hasSessionImbalance && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-destructive">
              {t("batchModal.sessionImbalanceWarning")}: {activeTerm.title}
            </span>
            <span className="leading-relaxed text-muted-foreground">
              {(() => {
                const even =
                  activeTerm.patternDetails?.find((d) => d.track === "EVEN")
                    ?.completedSessions ?? 0
                const odd =
                  activeTerm.patternDetails?.find((d) => d.track === "ODD")
                    ?.completedSessions ?? 0
                return t("batchModal.sessionImbalanceDesc", {
                  even: formatNumber(even, locale || "fa"),
                  odd: formatNumber(odd, locale || "fa"),
                  target: formatNumber(
                    activeTerm.sessionsCount ?? 18,
                    locale || "fa"
                  ),
                })
              })()}
            </span>
          </div>
        </div>
      )}

      {/* Proposals View: Calendar or Table */}
      {proposals.length > 0 ? (
        viewMode === "calendar" ? (
          <ProposalsCalendar
            proposals={proposals}
            selectedTermIndex={safeSelectedTermIndex}
            onSelectTermIndex={setSelectedTermIndex}
            onStartDateChange={onStartDateChange}
            onToggleHoliday={onToggleHoliday}
            onToggleCustomOffDay={onToggleCustomOffDay}
            onAddCompensatorySession={onAddCompensatorySession}
            onRemoveCompensatorySession={onRemoveCompensatorySession}
            locale={locale}
            observeOfficialHolidays={observeOfficialHolidays}
            customOffDays={customOffDays}
            activeDismissedHolidays={activeDismissedHolidays}
            compensatorySessions={compensatorySessions}
          />
        ) : (
          <ProposalsTable
            proposals={proposals}
            onTitleChange={onTitleChange}
            onStartDateChange={onStartDateChange}
            locale={locale}
          />
        )
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("batchModal.noProposals")}
        </div>
      )}

      {/* Bottom Actions Sticky / Card */}
      <div className="mt-4 flex flex-col-reverse items-center justify-end gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs sm:flex-row sm:p-5">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitLoading}
          onClick={onBack}
          className="w-full sm:w-auto"
        >
          {t("batchModal.backToSettings")}
        </Button>
        <Button
          type="button"
          disabled={isSubmitDisabled}
          onClick={onSubmit}
          className="w-full sm:w-auto"
        >
          {isSubmitLoading && (
            <Spinner className="size-5 text-primary-foreground" />
          )}
          <span>{t("batchModal.submit")}</span>
        </Button>
      </div>
    </div>
  )
}
