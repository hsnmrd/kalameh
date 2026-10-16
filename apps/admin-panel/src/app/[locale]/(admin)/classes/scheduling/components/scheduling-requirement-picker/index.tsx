"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { BookOpenCheck } from "lucide-react"
import type { ClassRequirementDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { SchedulingRequirementTable } from "./scheduling-requirement-table"
import { SchedulingRequirementCards } from "./scheduling-requirement-cards"

interface SchedulingRequirementPickerProps {
  items: ClassRequirementDto[]
  selectedIds: string[]
  isLoading: boolean
  hasTerm: boolean
  error?: string
  onChange: (ids: string[]) => void
  onNavigateToDemand?: () => void
}

export function SchedulingRequirementPicker({
  items,
  selectedIds,
  isLoading,
  hasTerm,
  error,
  onChange,
  onNavigateToDemand,
}: SchedulingRequirementPickerProps) {
  const t = useTranslations("scheduling.generation.requirements")

  const toggle = React.useCallback(
    (id: string, checked: boolean) => {
      onChange(
        checked
          ? Array.from(new Set([...selectedIds, id]))
          : selectedIds.filter((selectedId) => selectedId !== id)
      )
    },
    [onChange, selectedIds]
  )

  const toggleAll = React.useCallback(
    (checked: boolean) => {
      onChange(checked ? items.map((item) => item.id) : [])
    },
    [items, onChange]
  )

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <div className="flex min-h-32 items-center justify-center">
          <Spinner className="size-6 text-primary" />
          <span className="sr-only">{t("loading")}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 px-5 text-center">
          <BookOpenCheck aria-hidden className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {hasTerm ? t("empty") : t("chooseTerm")}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">
            {hasTerm ? t("emptyHint") : t("chooseTermHint")}
          </p>
          {hasTerm && onNavigateToDemand && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNavigateToDemand}
              className="mt-1 h-8 rounded-xl px-3 text-xs font-semibold"
            >
              {t("goToDemand")}
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: DataTable */}
          <div className="hidden lg:block">
            <SchedulingRequirementTable
              items={items}
              selectedIds={selectedIds}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
          </div>

          {/* Mobile: Cards */}
          <div className="lg:hidden">
            <SchedulingRequirementCards
              items={items}
              selectedIds={selectedIds}
              onToggle={toggle}
            />
          </div>
        </>
      )}
      <FieldError>{error}</FieldError>
    </div>
  )
}
