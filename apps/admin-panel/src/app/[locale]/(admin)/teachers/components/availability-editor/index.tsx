"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus, Trash2, Clock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import {
  WEEK_DAYS,
  type WeekDay,
  type TeacherAvailabilityInput,
} from "@workspace/types"

export interface AvailabilityEditorProps {
  value: TeacherAvailabilityInput[]
  onChange: (slots: TeacherAvailabilityInput[]) => void
}

export function AvailabilityEditor({
  value = [],
  onChange,
}: AvailabilityEditorProps) {
  const t = useTranslations("teachers")

  const [selectedDay, setSelectedDay] = React.useState<WeekDay>("SATURDAY")
  const [startTime, setStartTime] = React.useState("16:00")
  const [endTime, setEndTime] = React.useState("20:00")

  const dayOptions: ComboboxOption[] = React.useMemo(() => {
    return WEEK_DAYS.map((d) => ({
      value: d,
      label: t(`days.${d}`),
    }))
  }, [t])

  const handleAdd = () => {
    if (!startTime || !endTime) return

    const newSlot: TeacherAvailabilityInput = {
      dayOfWeek: selectedDay,
      startTime,
      endTime,
    }

    onChange([...value, newSlot])
  }

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold text-foreground">
          {t("availabilities.title")}
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("availabilities.description")}
      </p>

      {/* Add Slot Row */}
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-7">
        <div className="sm:col-span-3">
          <Field>
            <FieldLabel className="text-xs">
              {t("availabilities.day")}
            </FieldLabel>
            <ResponsiveCombobox
              items={dayOptions}
              value={selectedDay}
              onValueChange={(val) => {
                if (val) setSelectedDay(val as WeekDay)
              }}
              drawerTitle={t("availabilities.day")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:col-span-3">
          <Field>
            <FieldLabel className="text-xs">
              {t("availabilities.startTime")}
            </FieldLabel>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="text-center"
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs">
              {t("availabilities.endTime")}
            </FieldLabel>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="text-center"
            />
          </Field>
        </div>

        <div className="sm:col-span-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            className="h-14 w-full cursor-pointer rounded-2xl p-0"
            title={t("availabilities.addSlot")}
            aria-label={t("availabilities.addSlot")}
          >
            <Plus className="size-5" />
          </Button>
        </div>
      </div>

      {/* Slots List */}
      {value.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">
          {t("availabilities.noSlots")}
        </p>
      ) : (
        <div className="flex flex-col gap-2 pt-2">
          {value.map((slot, idx) => (
            <div
              key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}-${idx}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {t(`days.${slot.dayOfWeek}`)}:
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {slot.startTime} - {slot.endTime}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemove(idx)}
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label={t("availabilities.removeSlot")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
