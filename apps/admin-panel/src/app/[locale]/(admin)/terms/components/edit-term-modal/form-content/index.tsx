"use client"

import { Controller, type UseFormReturn } from "react-hook-form"
import { useLocale, useTranslations } from "next-intl"
import { AlertTriangle, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { FormDialogFooter } from "@workspace/ui/components/dialog"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import type {
  CompensatorySession,
  GeneratedTermProposal,
  SupportedLocale,
} from "@workspace/types"
import type { UpdateTermInput } from "../../../hooks/use-term-schemas"
import { ProposalsCalendar } from "../../generate-phase-terms-modal/proposals-calendar"

interface EditTermFormContentProps {
  form: UseFormReturn<UpdateTermInput>
  statusOptions: ComboboxOption[]
  proposals: GeneratedTermProposal[]
  lockedTermIndex: number
  targetPhaseId?: string | null
  classesCount: number
  isDateChanged: boolean
  isPending: boolean
  observeOfficialHolidays: boolean
  customOffDays: string[]
  activeDismissedHolidays: string[]
  compensatorySessions: Record<number, CompensatorySession[]>
  onStartDateChange: (index: number, date: string) => void
  onToggleHoliday: (date: string) => void
  onToggleCustomOffDay: (date: string) => void
  onAddCompensatorySession: (
    index: number,
    session: CompensatorySession
  ) => void
  onRemoveCompensatorySession: (index: number, date: string) => void
  onSubmit: (values: UpdateTermInput) => void
  onClose: () => void
}

export function EditTermFormContent({
  form,
  statusOptions,
  proposals,
  lockedTermIndex,
  targetPhaseId,
  classesCount,
  isDateChanged,
  isPending,
  observeOfficialHolidays,
  customOffDays,
  activeDismissedHolidays,
  compensatorySessions,
  onStartDateChange,
  onToggleHoliday,
  onToggleCustomOffDay,
  onAddCompensatorySession,
  onRemoveCompensatorySession,
  onSubmit,
  onClose,
}: EditTermFormContentProps) {
  const t = useTranslations("terms")
  const locale = useLocale() as SupportedLocale
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form
  const activeProposal = proposals[lockedTermIndex]

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col justify-between gap-0 overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel>{t("editModal.termTitle")}</FieldLabel>
            <Input {...register("title")} />
            <FieldError>{errors.title?.message}</FieldError>
          </Field>

          <Field>
            <FieldLabel>{t("editModal.isActive")}</FieldLabel>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <ResponsiveCombobox
                  items={statusOptions}
                  value={String(field.value ?? true)}
                  onValueChange={(value) => field.onChange(value === "true")}
                  placeholder={t("editModal.statusActive")}
                  drawerTitle={t("editModal.isActive")}
                  searchable={false}
                  clearable={false}
                  className="w-full"
                />
              )}
            />
          </Field>
        </div>

        {activeProposal?.hasSessionImbalance && (
          <div className="flex animate-in items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive fade-in-50">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-destructive">
                {t("batchModal.sessionImbalanceWarning")}:{" "}
                {activeProposal.title}
              </span>
              <span className="leading-relaxed text-muted-foreground">
                {t("batchModal.sessionImbalanceDesc", {
                  even: formatNumber(
                    activeProposal.patternDetails?.find(
                      (detail) => detail.track === "EVEN"
                    )?.completedSessions ?? 0,
                    locale || "fa"
                  ),
                  odd: formatNumber(
                    activeProposal.patternDetails?.find(
                      (detail) => detail.track === "ODD"
                    )?.completedSessions ?? 0,
                    locale || "fa"
                  ),
                  target: formatNumber(
                    activeProposal.sessionsCount ?? 18,
                    locale || "fa"
                  ),
                })}
              </span>
            </div>
          </div>
        )}

        {isDateChanged && (
          <div className="flex animate-in items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning fade-in-50">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>
              {t("editModal.dateChangeWarning", {
                count: formatNumber(classesCount, locale),
              })}
            </span>
          </div>
        )}

        {proposals.length > 0 && (
          <div className="mt-2 flex flex-col gap-3">
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
              onStartDateChange={onStartDateChange}
              onToggleHoliday={onToggleHoliday}
              onToggleCustomOffDay={onToggleCustomOffDay}
              onAddCompensatorySession={onAddCompensatorySession}
              onRemoveCompensatorySession={onRemoveCompensatorySession}
              locale={locale}
              observeOfficialHolidays={observeOfficialHolidays}
              customOffDays={customOffDays}
              activeDismissedHolidays={activeDismissedHolidays}
              compensatorySessions={compensatorySessions}
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
          {t("editModal.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isPending || Boolean(activeProposal?.hasSessionImbalance)}
          className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isPending && (
            <Spinner className="me-2 size-5 text-primary-foreground" />
          )}
          {t("editModal.submit")}
        </Button>
      </FormDialogFooter>
    </form>
  )
}
