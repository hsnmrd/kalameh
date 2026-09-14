"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarOff, Plus, Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Switch } from "@workspace/ui/components/switch"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@workspace/ui/components/empty"
import { toast } from "@workspace/ui/components/sonner"
import {
  gregorianToJalali,
  formatJalali,
  type InstituteCustomOffDay,
} from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AddOffDayModal } from "./add-off-day-modal"
import { DeleteOffDayModal } from "./delete-off-day-modal"
import { HolidaysCalendar } from "./holidays-calendar"

function formatDisplayDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + "T12:00:00")
    const j = gregorianToJalali(d)
    return formatJalali(j.year, j.month, j.day)
  } catch {
    return isoDate
  }
}

export function OffDaysContent() {
  const t = useTranslations("setting")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [selectedDateForAdd, setSelectedDateForAdd] = React.useState<
    string | undefined
  >(undefined)
  const [deletingOffDay, setDeletingOffDay] =
    React.useState<InstituteCustomOffDay | null>(null)

  // Fetch full institute details
  const { data: institute, isLoading: isLoadingInstitute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  // Fetch custom off days
  const { data: customOffDays = [], isLoading: isLoadingOffDays } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const customOffDaysDates = React.useMemo(() => {
    return customOffDays.map((d) => d.date)
  }, [customOffDays])

  // Mutation to toggle observeOfficialHolidays
  const updateMutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("offDays.successUpdateSettings"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.detail.baseKey(),
      })
    },
  })

  const observeOfficialHolidays = institute?.observeOfficialHolidays ?? true

  const handleToggleObserve = (checked: boolean) => {
    if (!activeInstituteId) return
    updateMutation.mutate({
      id: activeInstituteId,
      body: {
        observeOfficialHolidays: checked,
      },
    })
  }

  if (!activeInstituteId) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {t("offDays.description")}
      </p>

      {/* Official Holidays Toggle Row */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-background/60 p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("offDays.observeHolidaysTitle")}
            </span>
            {updateMutation.isPending && <Spinner className="size-3.5" />}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("offDays.observeHolidaysDescription")}
          </p>
        </div>
        <Switch
          checked={observeOfficialHolidays}
          onCheckedChange={handleToggleObserve}
          disabled={isLoadingInstitute || updateMutation.isPending}
        />
      </div>

      {/* Interactive Holiday & Off-Days Calendar */}
      <HolidaysCalendar
        instituteId={activeInstituteId}
        observeOfficialHolidays={observeOfficialHolidays}
        dismissedHolidays={institute?.dismissedHolidays}
        customOffDays={customOffDaysDates}
        onOpenAddModalWithDate={(dateIso) => {
          setSelectedDateForAdd(dateIso)
          setIsAddOpen(true)
        }}
      />

      {/* Custom Off-Days Section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-semibold text-foreground">
              {t("offDays.customOffDaysTitle")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("offDays.customOffDaysDescription")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedDateForAdd(undefined)
              setIsAddOpen(true)
            }}
            className="h-10 cursor-pointer gap-2 rounded-xl px-3.5 text-xs font-semibold"
          >
            <Plus className="size-4" />
            <span>{t("offDays.addOffDay")}</span>
          </Button>
        </div>

        {/* List / Empty State */}
        {isLoadingOffDays ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        ) : customOffDays.length === 0 ? (
          <Empty
            variant="compact"
            className="min-h-[160px] rounded-xl border border-dashed border-border"
          >
            <EmptyHeader>
              <EmptyMedia variant="default" className="size-10 rounded-xl">
                <CalendarOff className="size-5" />
              </EmptyMedia>
              <EmptyDescription className="text-xs">
                {t("offDays.noCustomOffDays")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-background">
            {customOffDays.map((item) => {
              const jalaliDate = formatDisplayDate(item.date)
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 sm:px-4"
                >
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="font-sans text-xs text-muted-foreground">
                      {jalaliDate}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingOffDay(item)}
                    className="size-9 cursor-pointer rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddOffDayModal
        open={isAddOpen}
        onClose={() => {
          setIsAddOpen(false)
          setSelectedDateForAdd(undefined)
        }}
        instituteId={activeInstituteId}
        observeOfficialHolidays={observeOfficialHolidays}
        existingOffDays={customOffDays.map((d) => d.date)}
        defaultDate={selectedDateForAdd}
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
