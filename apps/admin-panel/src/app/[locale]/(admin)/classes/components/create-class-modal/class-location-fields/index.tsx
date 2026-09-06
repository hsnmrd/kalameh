"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Controller, type Control, type FieldErrors } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Button } from "@workspace/ui/components/button"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { AlertTriangle, School, Search, X, Laptop } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { ClassroomDto } from "@workspace/types"
import type { CreateClassInput } from "../../../hooks/use-class-schemas"
import { ClassroomPickerModal } from "../../classroom-picker-modal"

export interface ClassLocationFieldsProps {
  control: Control<CreateClassInput>
  errors: FieldErrors<CreateClassInput>
  branchOptions: ComboboxOption[]
  classroomOptions?: ComboboxOption[]
  classrooms?: ClassroomDto[]
  selectedClassroom?: ClassroomDto | null
  classCapacity: number
  isCapacityExceeded: boolean
}

export function ClassLocationFields({
  control,
  errors,
  branchOptions,
  classrooms = [],
  selectedClassroom,
  classCapacity,
  isCapacityExceeded,
}: ClassLocationFieldsProps) {
  const t = useTranslations("classes")
  const [isClassroomPickerOpen, setIsClassroomPickerOpen] =
    React.useState(false)

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

        {/* Classroom (Optional - Opens Classroom Picker Modal) */}
        <Field data-invalid={Boolean(errors.classroomId)}>
          <FieldLabel>{t("createModal.classroom")}</FieldLabel>
          <Controller
            control={control}
            name="classroomId"
            render={({ field }) => {
              const isRemote =
                field.value === "REMOTE" || field.value === "NONE"
              const hasSelection = Boolean(selectedClassroom || isRemote)

              return (
                <div className="relative w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsClassroomPickerOpen(true)}
                    className={cn(
                      "flex h-14 w-full cursor-pointer items-center justify-between rounded-2xl border border-border bg-background px-4 font-normal shadow-2xs transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
                      hasSelection && "pe-12",
                      Boolean(errors.classroomId) &&
                        "border-destructive ring-1 ring-destructive"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      {isRemote ? (
                        <Laptop className="size-5 shrink-0 text-muted-foreground" />
                      ) : (
                        <School className="size-5 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-start text-sm sm:text-base",
                            hasSelection
                              ? "font-medium text-foreground"
                              : "text-muted-foreground/45"
                          )}
                        >
                          {selectedClassroom
                            ? `${selectedClassroom.name} (${selectedClassroom.capacity} نفر)`
                            : isRemote
                              ? t("classroomPicker.remoteClass")
                              : t("createModal.classroomPlaceholder")}
                        </span>

                        {isRemote && (
                          <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                            {t("classroomPicker.remoteBadge")}
                          </span>
                        )}
                      </div>
                    </div>
                    {!hasSelection && (
                      <Search className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </Button>

                  {hasSelection && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => field.onChange(null)}
                      className="absolute end-2 top-1/2 size-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:text-foreground"
                      title={t("createModal.noClassroom")}
                    >
                      <X className="size-4 text-muted-foreground" />
                      <span className="sr-only">
                        {t("createModal.noClassroom")}
                      </span>
                    </Button>
                  )}

                  <ClassroomPickerModal
                    open={isClassroomPickerOpen}
                    onClose={() => setIsClassroomPickerOpen(false)}
                    classrooms={classrooms}
                    selectedClassroomId={field.value}
                    classCapacity={classCapacity}
                    onSelectClassroom={(id) => field.onChange(id)}
                  />
                </div>
              )
            }}
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
