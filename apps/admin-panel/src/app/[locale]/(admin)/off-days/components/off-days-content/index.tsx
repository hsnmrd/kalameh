"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarOff } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import { toast } from "@workspace/ui/components/sonner"
import { Link } from "@/i18n/routing"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { HolidaysCalendar } from "./holidays-calendar"

export function OffDaysContent() {
  const t = useTranslations("setting")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const { data: institute, isLoading: isLoadingInstitute } = useQuery({
    ...institutesResource.detail.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const { data: customOffDays = [] } = useQuery({
    ...institutesResource.customOffDays.toQuery(activeInstituteId!),
    enabled: Boolean(activeInstituteId),
  })

  const customOffDaysDates = React.useMemo(
    () => customOffDays.map((offDay) => offDay.date),
    [customOffDays]
  )

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
      body: { observeOfficialHolidays: checked },
    })
  }

  if (!activeInstituteId) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {t("offDays.description")}
        </p>
        <Button
          render={<Link href="/off-days/custom" />}
          nativeButton={false}
          variant="outline"
          className="cursor-pointer"
        >
          <CalendarOff data-icon="inline-start" />
          <span>{t("offDays.manageCustomOffDays")}</span>
        </Button>
      </div>

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

      <HolidaysCalendar
        instituteId={activeInstituteId}
        observeOfficialHolidays={observeOfficialHolidays}
        dismissedHolidays={institute?.dismissedHolidays}
        customOffDays={customOffDaysDates}
      />
    </div>
  )
}
