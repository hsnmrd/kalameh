"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Calculator, Check, CalendarDays, Sparkles } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Badge } from "@workspace/ui/components/badge"
import { Spinner } from "@workspace/ui/components/spinner"
import { type CalculatedTermSchedule } from "@workspace/types"
import { termsResource } from "@/lib/api"

export interface TermCalculatorSectionProps {
  startDate: string
  onApplyDate: (calculatedEndDate: string) => void
}

export function TermCalculatorSection({
  startDate,
  onApplyDate,
}: TermCalculatorSectionProps) {
  const t = useTranslations("terms")
  const [isOpen, setIsOpen] = React.useState(false)
  const [targetDays, setTargetDays] = React.useState(45)
  const [skipHolidays, setSkipHolidays] = React.useState(true)
  const [result, setResult] = React.useState<CalculatedTermSchedule | null>(
    null
  )

  const calculateMutation = useMutation({
    ...termsResource.previewSchedule.toMutation(),
    onSuccess: (data) => {
      setResult(data)
    },
  })

  const handleCalculate = () => {
    if (!startDate || targetDays <= 0) return
    calculateMutation.mutate({
      startDate,
      targetDays,
      targetSessions: targetDays,
      skipHolidays,
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 transition-colors">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-auto cursor-pointer items-center gap-2 p-0 text-start text-sm font-semibold text-foreground hover:bg-transparent hover:text-primary"
        >
          <Sparkles className="size-4" />
          <span>{t("createModal.smartCalcToggle")}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 text-xs text-muted-foreground"
        >
          {isOpen ? "−" : "+"}
        </Button>
      </div>

      {isOpen && (
        <div className="mt-4 flex flex-col gap-4 border-t border-border/50 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("createModal.targetDays")}</FieldLabel>
              <Input
                type="number"
                min={1}
                max={365}
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value) || 1)}
                placeholder={t("createModal.targetDaysPlaceholder")}
              />
            </Field>

            <div className="flex items-center gap-2 sm:pt-7">
              <Checkbox
                id="skipHolidays"
                checked={skipHolidays}
                onCheckedChange={(checked) => setSkipHolidays(Boolean(checked))}
              />
              <label
                htmlFor="skipHolidays"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                {t("createModal.skipHolidays")}
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={
                !startDate || targetDays <= 0 || calculateMutation.isPending
              }
              onClick={handleCalculate}
              className="h-10 cursor-pointer gap-2 rounded-xl text-xs font-semibold"
            >
              {calculateMutation.isPending ? (
                <Spinner className="size-4 text-foreground" />
              ) : (
                <Calculator className="size-4 text-foreground" />
              )}
              <span>{t("createModal.calculateButton")}</span>
            </Button>
            {!startDate && (
              <span className="text-xs text-muted-foreground">
                ({t("createModal.startDateRequiredForCalc")})
              </span>
            )}
          </div>

          {result && (
            <div className="flex flex-col gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-foreground" />
                  <span>
                    {t("createModal.calculatedEndDate", {
                      date: result.endDateJalali,
                      days: result.totalDaysSpan,
                    })}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onApplyDate(result.endDate)}
                  className="h-8 cursor-pointer gap-1.5 rounded-lg bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="size-3.5" />
                  <span>{t("createModal.applyDate")}</span>
                </Button>
              </div>

              {result.holidaysEncountered.length > 0 ? (
                <div className="flex flex-col gap-1.5 pt-1 text-xs text-muted-foreground">
                  <span>
                    {t("createModal.holidaysCount", {
                      count: result.holidaysEncountered.length,
                    })}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {result.holidaysEncountered.map((h, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="rounded-md px-2 py-0.5 text-[11px]"
                      >
                        {h.dateJalali}: {h.titleFa}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {t("createModal.noHolidaysFound")}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
