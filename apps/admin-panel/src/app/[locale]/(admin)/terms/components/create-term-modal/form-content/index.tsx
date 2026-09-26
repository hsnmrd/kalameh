"use client"

import { useLocale, useTranslations } from "next-intl"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { DatePicker } from "@workspace/ui/components/date-picker"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import { FormDialogFooter } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import type {
  CompensatorySession,
  GeneratedTermProposal,
  SupportedLocale,
} from "@workspace/types"
import type { CreateTermInput } from "../../../hooks/use-term-schemas"
import { PhaseSelectField } from "../../phase-select-field"
import { ProposalsCalendar } from "../../generate-phase-terms-modal/proposals-calendar"
import { TermCalculatorSection } from "../term-calculator-section"

interface FormContentProps {
  form: UseFormReturn<CreateTermInput>
  startDate: string | undefined
  phaseId: string | null | undefined
  proposals: GeneratedTermProposal[]
  lockedTermIndex: number
  observeOfficialHolidays: boolean
  customOffDays: string[]
  dismissedHolidays: string[]
  compensatorySessions: Record<number, CompensatorySession[]>
  isPending: boolean
  onSubmit: (values: CreateTermInput) => void
  onClose: () => void
  onStartDateChange: (index: number, date: string) => void
  onToggleHoliday: (date: string) => void
  onToggleCustomOffDay: (date: string) => void
  onAddCompensatorySession: (
    index: number,
    session: CompensatorySession
  ) => void
  onRemoveCompensatorySession: (index: number, date: string) => void
}

export function FormContent({
  form,
  startDate,
  phaseId,
  proposals,
  lockedTermIndex,
  observeOfficialHolidays,
  customOffDays,
  dismissedHolidays,
  compensatorySessions,
  isPending,
  onSubmit,
  onClose,
  onStartDateChange,
  onToggleHoliday,
  onToggleCustomOffDay,
  onAddCompensatorySession,
  onRemoveCompensatorySession,
}: FormContentProps) {
  const t = useTranslations("terms")
  const locale = useLocale() as SupportedLocale
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = form

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col justify-between gap-0 overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel>{t("createModal.termTitle")}</FieldLabel>
            <Input
              {...register("title")}
              placeholder={t("createModal.titlePlaceholder")}
            />
            <FieldError>{errors.title?.message}</FieldError>
          </Field>
          <Controller
            control={control}
            name="operatingPhaseId"
            render={({ field }) => (
              <PhaseSelectField value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["startDate", "endDate"] as const).map((name) => (
            <Field key={name} data-invalid={Boolean(errors[name])}>
              <FieldLabel>{t(`createModal.${name}`)}</FieldLabel>
              <Controller
                control={control}
                name={name}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || undefined}
                    onChange={(value) => field.onChange(value || "")}
                    locale={locale}
                    placeholder={t(`createModal.${name}`)}
                    data-invalid={Boolean(errors[name])}
                    showOffDays
                  />
                )}
              />
              <FieldError>{errors[name]?.message}</FieldError>
            </Field>
          ))}
        </div>
        <TermCalculatorSection
          startDate={startDate || ""}
          onApplyDate={(date) => setValue("endDate", date)}
        />
        {proposals.length > 0 && (
          <div className="mt-2 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-t border-border/60 pt-4">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">
                {phaseId
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
              activeDismissedHolidays={dismissedHolidays}
              compensatorySessions={compensatorySessions}
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
          {t("createModal.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isPending && (
            <Spinner className="me-2 size-5 text-primary-foreground" />
          )}
          {t("createModal.submit")}
        </Button>
      </FormDialogFooter>
    </form>
  )
}
