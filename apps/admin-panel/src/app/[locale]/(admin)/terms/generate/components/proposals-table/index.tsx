"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { AlertTriangle } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@workspace/ui/components/table"
import type { GeneratedTermProposal } from "@workspace/types"
import { ProposalCard } from "./proposal-card"

export interface ProposalsTableProps {
  proposals: GeneratedTermProposal[]
  onTitleChange: (index: number, newTitle: string) => void
  onStartDateChange: (index: number, newStartDate: string) => void
  locale?: "fa" | "en"
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

export function ProposalsTable({
  proposals,
  onTitleChange,
  onStartDateChange,
  locale,
  dateConflicts,
  existingTerms,
}: ProposalsTableProps) {
  const t = useTranslations("terms")
  const defaultLocale = useLocale() as "fa" | "en"
  const activeLocale = locale || defaultLocale

  const getMinDate = (index: number): Date | undefined => {
    if (index === 0) {
      if (!existingTerms || existingTerms.length === 0) return undefined
      let latestEnd: Date | undefined
      for (const et of existingTerms) {
        const raw =
          (typeof et.endDate === "string"
            ? et.endDate
            : et.endDate.toISOString()
          ).split("T")[0] || ""
        const parts = raw.split("-").map(Number)
        const [y, m, d] = parts
        if (y !== undefined && m !== undefined && d !== undefined) {
          const endD = new Date(y, m - 1, d, 0, 0, 0)
          if (!latestEnd || endD > latestEnd) {
            latestEnd = endD
          }
        }
      }
      if (latestEnd) {
        const min = new Date(latestEnd)
        min.setDate(min.getDate() + 1)
        return min
      }
      return undefined
    }
    const prevEndIso = proposals[index - 1]?.endDate
    if (!prevEndIso) return undefined
    const raw = prevEndIso.split("T")[0] || ""
    const parts = raw.split("-").map(Number)
    const [y, m, d] = parts
    if (y !== undefined && m !== undefined && d !== undefined) {
      // Must start after previous term end date
      return new Date(y, m - 1, d + 1, 0, 0, 0)
    }
    return undefined
  }

  const isDateOccupied = React.useCallback(
    (date: Date): boolean => {
      if (!existingTerms || existingTerms.length === 0) return false
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, "0")
      const d = String(date.getDate()).padStart(2, "0")
      const ymd = `${y}-${m}-${d}`
      return existingTerms.some((term) => {
        const s =
          (typeof term.startDate === "string"
            ? term.startDate
            : term.startDate.toISOString()
          ).split("T")[0] || ""
        const e =
          (typeof term.endDate === "string"
            ? term.endDate
            : term.endDate.toISOString()
          ).split("T")[0] || ""
        return ymd >= s && ymd <= e
      })
    },
    [existingTerms]
  )

  return (
    <>
      {/* Responsive Cards View (< md) */}
      <div className="flex flex-col gap-3 md:hidden">
        {proposals.map((item, index) => {
          const conflictsForTerm = dateConflicts?.filter(
            (c) => c.termIndex === index || c.termTitle === item.title
          )
          const conflictingTitles = Array.from(
            new Set(conflictsForTerm?.map((c) => c.conflictingTitle) ?? [])
          ).join("، ")

          return (
            <ProposalCard
              key={index}
              proposal={item}
              index={index}
              minDate={getMinDate(index)}
              disabledDates={isDateOccupied}
              onTitleChange={onTitleChange}
              onStartDateChange={onStartDateChange}
              locale={activeLocale}
              conflictingTitles={conflictingTitles || undefined}
            />
          )
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                {t("batchModal.colNumber")}
              </TableHead>
              <TableHead>{t("batchModal.colTitle")}</TableHead>
              <TableHead>{t("batchModal.colMonths")}</TableHead>
              <TableHead>{t("batchModal.colStart")}</TableHead>
              <TableHead>{t("batchModal.colEnd")}</TableHead>
              <TableHead className="text-center">
                {t("batchModal.colSessions")}
              </TableHead>
              <TableHead className="text-center">
                {t("batchModal.colDays")}
              </TableHead>
              <TableHead className="text-center">
                {t("batchModal.colHolidays")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((item, index) => {
              const conflictsForTerm = dateConflicts?.filter(
                (c) => c.termIndex === index || c.termTitle === item.title
              )
              const hasConflict = Boolean(
                conflictsForTerm && conflictsForTerm.length > 0
              )
              const conflictingTitles = Array.from(
                new Set(conflictsForTerm?.map((c) => c.conflictingTitle) ?? [])
              ).join("، ")

              return (
                <TableRow
                  key={index}
                  className={
                    hasConflict
                      ? "bg-destructive/5 hover:bg-destructive/10"
                      : undefined
                  }
                >
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="min-w-[160px]">
                    <div className="flex flex-col gap-1">
                      <Input
                        value={item.title}
                        onChange={(e) => onTitleChange(index, e.target.value)}
                        className={cn(
                          "h-9 text-xs font-semibold",
                          hasConflict &&
                            "border-destructive/60 focus-visible:ring-destructive/30"
                        )}
                      />
                      {hasConflict && conflictingTitles && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                          <AlertTriangle className="size-3 shrink-0" />
                          <span className="truncate">
                            {t("batchModal.cardConflictNotice", {
                              title: conflictingTitles,
                            })}
                          </span>
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                    {item.monthNamesFa}
                  </TableCell>
                  <TableCell className="min-w-[130px]">
                    <DatePicker
                      variant="inline"
                      value={item.startDate}
                      minDate={getMinDate(index)}
                      disabledDates={isDateOccupied}
                      onChange={(val) => {
                        if (val) {
                          onStartDateChange(index, val)
                        }
                      }}
                      locale={activeLocale}
                      clearable={false}
                      showOffDays
                      className={
                        hasConflict ? "border-destructive/60" : undefined
                      }
                    />
                  </TableCell>
                  <TableCell className="text-xs font-medium whitespace-nowrap">
                    <span className="inline-flex h-8 items-center px-2 text-xs font-medium text-foreground">
                      {item.endDateJalali}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-xs font-semibold">
                    {item.sessionsCount ?? 18}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {item.daysCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={item.holidaysCount > 0 ? "secondary" : "outline"}
                      className="px-2 py-0.5 text-xs"
                    >
                      {item.holidaysCount}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
