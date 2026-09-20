"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import {
  Calendar as CalendarIcon,
  Layers,
  GraduationCap,
  CalendarDays,
  Clock,
  Sparkles,
  CalendarX2,
} from "lucide-react"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { Button } from "@workspace/ui/components/button"
import { formatNumber } from "@workspace/ui/lib/utils"
import {
  type TermDto,
  type SupportedLocale,
  type WeekDay,
  convertTermDtoToProposal,
  resolveClassPatterns,
} from "@workspace/types"
import {
  termsResource,
  institutesResource,
  operatingPhasesResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { TermStatusBadge } from "../term-status-badge"
import { ProposalsCalendar } from "../generate-phase-terms-modal/proposals-calendar"

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
  const { activeInstituteId } = useActiveInstitute()

  const formatDate = React.useCallback(
    (dateVal: string | Date | undefined) => {
      if (!dateVal) return "—"
      try {
        const d = new Date(dateVal)
        return new Intl.DateTimeFormat(
          locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        ).format(d)
      } catch {
        return String(dateVal)
      }
    },
    [locale]
  )

  const formatDateForInput = (dateVal: string | Date | undefined) => {
    if (!dateVal) return ""
    const d = new Date(dateVal)
    return d.toISOString().split("T")[0] || ""
  }

  // Fetch institute details for holiday preference
  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })

  // Fetch custom institute off-days
  const { data: rawCustomOffDays } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId && open),
  })

  // Fetch operating phases for day-of-week metadata
  const { data: phases = [] } = useQuery({
    ...operatingPhasesResource.list.toQuery({
      instituteId: activeInstituteId,
    }),
    enabled: Boolean(activeInstituteId && open),
  })

  const targetPhaseId = term?.operatingPhaseId
  // Fetch sibling terms if term belongs to an operating phase
  const { data: phaseTerms = [] } = useQuery({
    ...termsResource.list.toQuery({
      instituteId: activeInstituteId,
      operatingPhaseId: targetPhaseId || undefined,
    }),
    enabled: Boolean(activeInstituteId && targetPhaseId && open),
  })

  const activeDismissedHolidays = React.useMemo(
    () => institute?.dismissedHolidays ?? [],
    [institute?.dismissedHolidays]
  )

  const customOffDays = React.useMemo(
    () => rawCustomOffDays?.map((d) => d.date) ?? [],
    [rawCustomOffDays]
  )
  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true

  const getPhaseContext = React.useCallback(() => {
    const currentPhase = phases.find((p) => p.id === targetPhaseId)
    const phaseDays =
      currentPhase?.daysOfWeek && currentPhase.daysOfWeek.length > 0
        ? currentPhase.daysOfWeek
        : term?.operatingPhase?.daysOfWeek &&
            term.operatingPhase.daysOfWeek.length > 0
          ? term.operatingPhase.daysOfWeek
          : ["SATURDAY", "MONDAY", "WEDNESDAY"]
    const daysOfWeek = phaseDays as WeekDay[]
    const classPatterns = resolveClassPatterns(daysOfWeek)
    return { currentPhase, daysOfWeek, classPatterns }
  }, [phases, targetPhaseId, term])

  const buildInitialProposals = React.useCallback(
    (currentTerm: TermDto) => {
      const { daysOfWeek, classPatterns } = getPhaseContext()
      const currentPhase = phases.find(
        (p) => p.id === (currentTerm.operatingPhaseId || undefined)
      )
      const activeTermData = {
        id: currentTerm.id,
        title: currentTerm.title,
        startDate: formatDateForInput(currentTerm.startDate),
        endDate: formatDateForInput(currentTerm.endDate),
        operatingPhaseId: currentTerm.operatingPhaseId || undefined,
        operatingPhase: currentPhase
          ? { months: currentPhase.months, daysOfWeek: currentPhase.daysOfWeek }
          : currentTerm.operatingPhase,
      }

      if (!currentTerm.operatingPhaseId) {
        return [
          convertTermDtoToProposal(activeTermData, {
            daysOfWeek,
            classPatterns,
            observeOfficialHolidays,
            customOffDays,
            dismissedHolidays: activeDismissedHolidays,
            compensatorySessions: [],
          }),
        ]
      }

      const rawSiblings = (
        phaseTerms && phaseTerms.length > 0
          ? phaseTerms
          : (allTerms?.filter(
              (t) => t.operatingPhaseId === currentTerm.operatingPhaseId
            ) ?? [])
      ).filter((t) => t.id !== currentTerm.id)

      const allCombined = [...rawSiblings, activeTermData].sort((a, b) => {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0
        return aDate - bDate
      })

      return allCombined.map((t) => {
        const isCurrentTerm = t.id === currentTerm.id
        return convertTermDtoToProposal(t, {
          daysOfWeek,
          classPatterns,
          observeOfficialHolidays,
          customOffDays,
          dismissedHolidays: isCurrentTerm
            ? activeDismissedHolidays
            : undefined,
          compensatorySessions: [],
        })
      })
    },
    [
      getPhaseContext,
      phases,
      phaseTerms,
      allTerms,
      observeOfficialHolidays,
      customOffDays,
      activeDismissedHolidays,
    ]
  )

  const proposals = React.useMemo(() => {
    if (!term || !open) return []
    return buildInitialProposals(term)
  }, [term, open, buildInitialProposals])

  const lockedTermIndex = React.useMemo(() => {
    if (proposals.length <= 1) return 0
    const found = proposals.findIndex(
      (p) =>
        (term?.id && p.title === term.title) ||
        p.startDate === formatDateForInput(term?.startDate)
    )
    return found !== -1 ? found : 0
  }, [proposals, term?.title, term?.id, term?.startDate])

  const activeProposal = proposals[lockedTermIndex]

  const phaseTitle = React.useMemo(() => {
    if (!term?.operatingPhaseId) return t("viewModal.noPhase")
    const phase = phases.find((p) => p.id === term.operatingPhaseId)
    return (
      phase?.title ||
      term.operatingPhase?.title ||
      t("viewModal.operatingPhase")
    )
  }, [term, phases, t])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:h-[90dvh] sm:max-w-4xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("viewModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col justify-between gap-0 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Term Information Carousel */}
            <Carousel
              data-testid="term-info-carousel"
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="w-full"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="size-3.5" />
                  <span>{t("viewModal.termInfo")}</span>
                </span>
                <div className="flex items-center gap-1">
                  <CarouselPrevious className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
                  <CarouselNext className="static size-7 translate-x-0 translate-y-0 scale-100 rounded-lg border-border/80 bg-muted/40 opacity-100 shadow-none hover:bg-muted disabled:pointer-events-none disabled:opacity-30" />
                </div>
              </div>

              <CarouselContent className="items-stretch">
                {/* Title & Phase */}
                <CarouselItem className="flex shrink-0 basis-[260px]">
                  <div className="flex h-full min-h-[110px] w-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarIcon className="size-3.5" />
                        <span>{t("viewModal.termInfo")}</span>
                      </span>
                      <span className="truncate text-base font-bold text-foreground">
                        {term?.title || "—"}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Layers className="size-3" />
                      <span className="truncate">{phaseTitle}</span>
                    </span>
                  </div>
                </CarouselItem>

                {/* Status & Classes */}
                <CarouselItem className="flex shrink-0 basis-[260px]">
                  <div className="flex h-full min-h-[110px] w-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <GraduationCap className="size-3.5" />
                        <span>{t("viewModal.status")}</span>
                      </span>
                      <div className="pt-0.5">
                        {term && (
                          <TermStatusBadge term={term} allTerms={allTerms} />
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t("viewModal.classesCount")}:{" "}
                      <strong className="font-semibold text-foreground">
                        {formatNumber(term?.classesCount ?? 0, locale)}
                      </strong>
                    </span>
                  </div>
                </CarouselItem>

                {/* Start & End Dates */}
                <CarouselItem className="flex shrink-0 basis-[260px]">
                  <div className="flex h-full min-h-[110px] w-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        <span>{t("viewModal.startDate")}</span>
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatDate(term?.startDate)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t("viewModal.endDate")}:{" "}
                      <span className="font-medium text-foreground">
                        {formatDate(term?.endDate)}
                      </span>
                    </span>
                  </div>
                </CarouselItem>

                {/* Duration & Sessions / Holidays */}
                <CarouselItem className="flex shrink-0 basis-[260px]">
                  <div className="flex h-full min-h-[110px] w-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>{t("viewModal.daysCount")}</span>
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {activeProposal
                          ? t("batchModal.daysBadge", {
                              count: formatNumber(
                                activeProposal.daysCount,
                                locale
                              ),
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {activeProposal?.sessionsCount ? (
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="size-3 text-muted-foreground" />
                          <span>
                            {t("batchModal.sessionsBadge", {
                              count: formatNumber(
                                activeProposal.sessionsCount,
                                locale
                              ),
                            })}
                          </span>
                        </span>
                      ) : null}
                      {activeProposal?.holidaysCount ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarX2 className="size-3 text-muted-foreground" />
                          <span>
                            {t("batchModal.holidaysCountBadge", {
                              count: formatNumber(
                                activeProposal.holidaysCount,
                                locale
                              ),
                            })}
                          </span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>

            {/* Embedded Interactive Read-Only Calendar */}
            {proposals.length > 0 && (
              <div className="mt-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 border-t border-border/60 pt-4">
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {targetPhaseId
                      ? t("batchModal.calendarPhaseTitle")
                      : t("batchModal.calendarSingleTitle")}
                  </h4>
                </div>

                <ProposalsCalendar
                  proposals={proposals}
                  lockedTermIndex={lockedTermIndex}
                  locale={locale}
                  observeOfficialHolidays={observeOfficialHolidays}
                  customOffDays={customOffDays}
                  activeDismissedHolidays={activeDismissedHolidays}
                  readOnly={true}
                  showLegend={false}
                />
              </div>
            )}
          </div>

          <FormDialogFooter>
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
  )
}
