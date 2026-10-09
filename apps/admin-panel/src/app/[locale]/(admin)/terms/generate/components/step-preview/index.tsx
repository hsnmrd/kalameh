"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { AlertTriangle } from "lucide-react"
import { formatNumber } from "@workspace/ui/lib/utils"
import {
  type GeneratedTermProposal,
  type CompensatorySession,
  hasFutureDays,
} from "@workspace/types"
import { ProposalsCalendar } from "../../../components/proposals-calendar"

export interface StepPreviewProps {
  proposals: GeneratedTermProposal[]
  viewMode?: "calendar" | "table"
  onTitleChange?: (index: number, newTitle: string) => void
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
  dateConflicts?: Array<{
    termTitle: string
    conflictingTitle: string
    termIndex: number
  }>
  existingTerms?: Array<{
    id?: string
    title?: string
    startDate: string | Date
    endDate: string | Date
  }>
}

export function StepPreview({
  proposals,
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
  dateConflicts,
  existingTerms,
}: StepPreviewProps) {
  const t = useTranslations("terms")

  const [selectedTermIndex, setSelectedTermIndex] = React.useState<number>(0)
  const safeSelectedTermIndex =
    selectedTermIndex >= proposals.length && proposals.length > 0
      ? 0
      : selectedTermIndex

  const hasPastTerms = React.useMemo(() => {
    return proposals.some((p) => !hasFutureDays(p))
  }, [proposals])

  return (
    <div className="flex flex-col gap-5">
      {/* Past Term Warning Alert */}
      {hasPastTerms && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="flex flex-col gap-1">
            <span className="font-bold text-destructive">
              {t("createModal.pastTermNotAllowed")}
            </span>
          </div>
        </div>
      )}

      {/* Proposals View: Calendar Only */}
      {proposals.length > 0 ? (
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
          dateConflicts={dateConflicts}
          existingTerms={existingTerms}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("batchModal.noProposals")}
        </div>
      )}
    </div>
  )
}
