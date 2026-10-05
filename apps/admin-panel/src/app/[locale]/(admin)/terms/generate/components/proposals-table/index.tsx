"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { DatePicker } from "@workspace/ui/components/date-picker"
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
}

export function ProposalsTable({
  proposals,
  onTitleChange,
  onStartDateChange,
  locale,
}: ProposalsTableProps) {
  const t = useTranslations("terms")
  const defaultLocale = useLocale() as "fa" | "en"
  const activeLocale = locale || defaultLocale

  const getMinDate = (index: number): Date | undefined => {
    if (index === 0) return undefined
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

  return (
    <>
      {/* Responsive Cards View (< md) */}
      <div className="flex flex-col gap-3 md:hidden">
        {proposals.map((item, index) => (
          <ProposalCard
            key={index}
            proposal={item}
            index={index}
            minDate={getMinDate(index)}
            onTitleChange={onTitleChange}
            onStartDateChange={onStartDateChange}
            locale={activeLocale}
          />
        ))}
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
            {proposals.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="text-center font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <Input
                    value={item.title}
                    onChange={(e) => onTitleChange(index, e.target.value)}
                    className="h-9 text-xs font-semibold"
                  />
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                  {item.monthNamesFa}
                </TableCell>
                <TableCell className="min-w-[130px]">
                  <DatePicker
                    variant="inline"
                    value={item.startDate}
                    minDate={getMinDate(index)}
                    onChange={(val) => {
                      if (val) {
                        onStartDateChange(index, val)
                      }
                    }}
                    locale={activeLocale}
                    clearable={false}
                    showOffDays
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
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
