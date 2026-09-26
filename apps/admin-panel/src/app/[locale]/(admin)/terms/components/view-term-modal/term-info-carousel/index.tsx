"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  Calendar,
  CalendarDays,
  CalendarX2,
  Clock,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"
import { formatNumber } from "@workspace/ui/lib/utils"
import type {
  GeneratedTermProposal,
  SupportedLocale,
  TermDto,
} from "@workspace/types"
import { TermStatusBadge } from "../../term-status-badge"

interface Props {
  term: TermDto | null
  allTerms?: TermDto[]
  phaseTitle: string
  activeProposal?: GeneratedTermProposal
}

export function TermInfoCarousel({
  term,
  allTerms,
  phaseTitle,
  activeProposal,
}: Props) {
  const t = useTranslations("terms")
  const locale = useLocale() as SupportedLocale
  const formatDate = (value: string | Date | undefined) => {
    if (!value) return "—"
    try {
      return new Intl.DateTimeFormat(
        locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      ).format(new Date(value))
    } catch {
      return String(value)
    }
  }

  return (
    <Carousel
      data-testid="term-info-carousel"
      opts={{ align: "start", dragFree: true }}
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
        <CarouselItem className="flex shrink-0 basis-[260px]">
          <div className="flex h-full min-h-[110px] w-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="size-3.5" />
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
        <CarouselItem className="flex shrink-0 basis-[260px]">
          <div className="flex h-full min-h-[110px] w-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-3.5 shadow-2xs">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <GraduationCap className="size-3.5" />
                <span>{t("viewModal.status")}</span>
              </span>
              <div className="pt-0.5">
                {term && <TermStatusBadge term={term} allTerms={allTerms} />}
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
                      count: formatNumber(activeProposal.daysCount, locale),
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
                      count: formatNumber(activeProposal.sessionsCount, locale),
                    })}
                  </span>
                </span>
              ) : null}
              {activeProposal?.holidaysCount ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarX2 className="size-3 text-muted-foreground" />
                  <span>
                    {t("batchModal.holidaysCountBadge", {
                      count: formatNumber(activeProposal.holidaysCount, locale),
                    })}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </CarouselItem>
      </CarouselContent>
    </Carousel>
  )
}
