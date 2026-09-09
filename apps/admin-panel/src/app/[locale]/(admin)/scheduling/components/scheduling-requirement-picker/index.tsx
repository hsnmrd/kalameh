"use client"

import { useLocale, useTranslations } from "next-intl"
import { BookOpenCheck } from "lucide-react"
import type { ClassRequirementDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"

interface SchedulingRequirementPickerProps {
  items: ClassRequirementDto[]
  selectedIds: string[]
  isLoading: boolean
  hasTerm: boolean
  error?: string
  onChange: (ids: string[]) => void
}

export function SchedulingRequirementPicker({
  items,
  selectedIds,
  isLoading,
  hasTerm,
  error,
  onChange,
}: SchedulingRequirementPickerProps) {
  const t = useTranslations("scheduling.generation.requirements")
  const locale = useLocale()

  const toggle = (id: string, checked: boolean) => {
    onChange(
      checked
        ? Array.from(new Set([...selectedIds, id]))
        : selectedIds.filter((selectedId) => selectedId !== id)
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm leading-none font-medium text-foreground">
            {t("label")}
          </p>
          <FieldDescription>{t("description")}</FieldDescription>
        </div>
        {items.length > 0 && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={() => onChange(items.map((item) => item.id))}
            >
              {t("selectAll")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              disabled={selectedIds.length === 0}
              onClick={() => onChange([])}
            >
              {t("clear")}
            </Button>
          </div>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto rounded-2xl border border-border bg-background p-2">
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner className="size-6 text-primary" />
            <span className="sr-only">{t("loading")}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 px-5 text-center">
            <BookOpenCheck
              aria-hidden
              className="size-6 text-muted-foreground"
            />
            <p className="text-sm font-medium text-foreground">
              {hasTerm ? t("empty") : t("chooseTerm")}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {hasTerm ? t("emptyHint") : t("chooseTermHint")}
            </p>
          </div>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {items.map((item) => {
              const checked = selectedIds.includes(item.id)
              const checkboxId = `requirement-${item.id}`

              return (
                <div
                  key={item.id}
                  className="flex min-h-16 items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={checked}
                    onCheckedChange={(value) => toggle(item.id, Boolean(value))}
                    aria-label={item.course?.title ?? t("unnamed")}
                    className="mt-0.5"
                  />
                  <FieldLabel
                    htmlFor={checkboxId}
                    className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 leading-5"
                  >
                    <span className="truncate">
                      {item.course?.title ?? t("unnamed")}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {t("summary", {
                        classes: formatNumber(item.requiredClassCount, locale),
                        capacity: formatNumber(item.capacity, locale),
                      })}
                    </span>
                  </FieldLabel>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}
