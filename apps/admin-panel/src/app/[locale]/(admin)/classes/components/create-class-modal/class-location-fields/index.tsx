"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Controller, type Control, type FieldErrors } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AlertTriangle } from "lucide-react"
import type { ClassroomDto } from "@workspace/types"
import type { CreateClassInput } from "../../../hooks/use-class-schemas"

export interface ClassLocationFieldsProps {
  control: Control<CreateClassInput>
  errors: FieldErrors<CreateClassInput>
  branchOptions: ComboboxOption[]
  classroomOptions: ComboboxOption[]
  selectedClassroom?: ClassroomDto | null
  classCapacity: number
  isCapacityExceeded: boolean
}

export function ClassLocationFields({
  control,
  errors,
  branchOptions,
  classroomOptions,
  selectedClassroom,
  classCapacity,
  isCapacityExceeded,
}: ClassLocationFieldsProps) {
  const t = useTranslations("classes")

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Branch (Optional) */}
        <Field data-invalid={Boolean(errors.branchId)}>
          <FieldLabel>{t("createModal.branch")}</FieldLabel>
          <Controller
            control={control}
            name="branchId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={branchOptions}
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || null)}
                placeholder={t("createModal.branchPlaceholder")}
                drawerTitle={t("createModal.branch")}
                className="w-full"
              />
            )}
          />
          <FieldError>{errors.branchId?.message}</FieldError>
        </Field>

        {/* Classroom (Optional) */}
        <Field data-invalid={Boolean(errors.classroomId)}>
          <FieldLabel>{t("createModal.classroom")}</FieldLabel>
          <Controller
            control={control}
            name="classroomId"
            render={({ field }) => (
              <ResponsiveCombobox
                items={classroomOptions}
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || null)}
                placeholder={t("createModal.classroomPlaceholder")}
                drawerTitle={t("createModal.classroom")}
                className="w-full"
              />
            )}
          />
          <FieldError>{errors.classroomId?.message}</FieldError>
        </Field>
      </div>

      {/* Classroom Capacity Warning */}
      {isCapacityExceeded && selectedClassroom && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs font-medium text-warning">
          <AlertTriangle className="size-4 shrink-0 text-warning" />
          <span>
            {t("createModal.capacityWarning", {
              classCapacity,
              roomCapacity: selectedClassroom.capacity,
            })}
          </span>
        </div>
      )}
    </>
  )
}
