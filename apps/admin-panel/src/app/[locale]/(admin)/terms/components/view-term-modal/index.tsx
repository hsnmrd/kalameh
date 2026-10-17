"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Calendar, CheckCircle2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import {
  PERMISSIONS,
  type SupportedLocale,
  type TermDto,
} from "@workspace/types"
import { PermissionGuard } from "@/components/permission-guard"
import { ProposalsCalendar } from "../proposals-calendar"
import { useViewTermCalendar } from "./hooks/use-view-term-calendar"
import { TermInfoCarousel } from "./term-info-carousel"
import { FinalizeScoresModal } from "../finalize-scores-modal"

export interface ViewTermModalProps {
  term: TermDto | null
  open: boolean
  onClose: () => void
  allTerms?: TermDto[]
}

export function ViewTermModal({
  term,
  open,
  onClose,
  allTerms,
}: ViewTermModalProps) {
  const t = useTranslations("terms")
  const locale = useLocale() as SupportedLocale
  const isMobile = useIsMobile()
  const calendar = useViewTermCalendar(term, allTerms, open)
  const [finalizeOpen, setFinalizeOpen] = React.useState(false)

  const canFinalizeScores = Boolean(
    term &&
    !term.scoresFinalizedAt &&
    (term.lifecycleStatuses?.includes("GRADING") ||
      term.lifecycleStatus === "GRADING" ||
      new Date(term.endDate) < new Date())
  )

  return (
    <>
      <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <FormDialogContent className="sm:h-[90dvh] sm:max-w-4xl">
          <FormDialogHeader>
            <FormDialogTitle>{t("viewModal.title")}</FormDialogTitle>
            <FormDialogCloseButton />
          </FormDialogHeader>
          <div className="flex min-h-0 flex-1 flex-col justify-between gap-0 overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              <TermInfoCarousel
                term={term}
                allTerms={allTerms}
                phaseTitle={calendar.phaseTitle}
                activeProposal={calendar.activeProposal}
              />
              {calendar.proposals.length > 0 && (
                <div className="mt-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-t border-border/60 pt-4">
                    <Calendar className="size-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">
                      {calendar.phaseId
                        ? t("batchModal.calendarPhaseTitle")
                        : t("batchModal.calendarSingleTitle")}
                    </h4>
                  </div>
                  <ProposalsCalendar
                    proposals={calendar.proposals}
                    lockedTermIndex={calendar.lockedTermIndex}
                    locale={locale}
                    observeOfficialHolidays={calendar.observeOfficialHolidays}
                    customOffDays={calendar.customOffDays}
                    activeDismissedHolidays={calendar.dismissedHolidays}
                    readOnly
                    showLegend={false}
                    numberOfMonths={isMobile ? 1 : 2}
                  />
                </div>
              )}
            </div>
            <FormDialogFooter className="flex items-center justify-between gap-2">
              <div>
                {canFinalizeScores && (
                  <PermissionGuard
                    permission={PERMISSIONS.MANAGE_TERMS}
                    mode="hide"
                  >
                    <Button
                      type="button"
                      onClick={() => setFinalizeOpen(true)}
                      className="h-14 rounded-2xl px-6 text-base"
                    >
                      <CheckCircle2 className="me-2 size-4" />
                      {t("finalizeScoresModal.button")}
                    </Button>
                  </PermissionGuard>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
              >
                {t("viewModal.close")}
              </Button>
            </FormDialogFooter>
          </div>
        </FormDialogContent>
      </FormDialog>
      {finalizeOpen && (
        <FinalizeScoresModal
          open={finalizeOpen}
          onClose={() => setFinalizeOpen(false)}
          term={term}
          onSuccess={onClose}
        />
      )}
    </>
  )
}
