"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, CalendarOff, Plus, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@workspace/ui/components/empty"
import { Spinner } from "@workspace/ui/components/spinner"
import type { InstituteCustomOffDay } from "@workspace/types"
import { Link, useIsRtl } from "@/i18n/routing"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AddOffDayModal } from "./add-off-day-modal"
import { DeleteOffDayModal } from "./delete-off-day-modal"

function formatDisplayDate(isoDate: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(
      locale === "fa" ? "fa-IR-u-ca-persian" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    ).format(new Date(`${isoDate}T12:00:00`))
  } catch {
    return isoDate
  }
}

export function CustomOffDaysContent() {
  const t = useTranslations("setting.offDays")
  const locale = useLocale()
  const isRtl = useIsRtl()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft
  const { activeInstituteId } = useActiveInstitute()
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [deletingOffDay, setDeletingOffDay] =
    React.useState<InstituteCustomOffDay | null>(null)

  const { data: institute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const { data: customOffDays = [], isLoading } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  if (!activeInstituteId) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("customOffDaysDescription")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            render={<Link href="/off-days" />}
            nativeButton={false}
            variant="ghost"
            className="cursor-pointer"
          >
            <BackIcon data-icon="inline-start" />
            <span>{t("backToCalendar")}</span>
          </Button>
          <Button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="cursor-pointer"
          >
            <Plus data-icon="inline-start" />
            <span>{t("addOffDay")}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner className="size-6" />
        </div>
      ) : customOffDays.length === 0 ? (
        <Empty
          variant="compact"
          className="min-h-[240px] rounded-xl border border-dashed border-border"
        >
          <EmptyHeader>
            <EmptyMedia variant="default" className="size-10 rounded-xl">
              <CalendarOff className="size-5" />
            </EmptyMedia>
            <EmptyDescription>{t("noCustomOffDays")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-background">
          {customOffDays.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-3.5 sm:px-4"
            >
              <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.title}
                </span>
                <span className="shrink-0 font-sans text-xs text-muted-foreground">
                  {formatDisplayDate(item.date, locale)}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("deleteOffDayLabel", { title: item.title })}
                onClick={() => setDeletingOffDay(item)}
                className="cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddOffDayModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        instituteId={activeInstituteId}
        observeOfficialHolidays={institute?.observeOfficialHolidays ?? true}
        existingOffDays={customOffDays.map((offDay) => offDay.date)}
      />
      <DeleteOffDayModal
        open={Boolean(deletingOffDay)}
        onClose={() => setDeletingOffDay(null)}
        offDay={deletingOffDay}
        instituteId={activeInstituteId}
      />
    </div>
  )
}
