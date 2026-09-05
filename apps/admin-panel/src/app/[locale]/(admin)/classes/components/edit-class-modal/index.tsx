"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PriceInput } from "@workspace/ui/components/price-input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import type { ClassDto } from "@workspace/types"
import {
  classesResource,
  termsResource,
  coursesResource,
  branchesResource,
  classroomsResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { Calendar as CalendarIcon, AlertTriangle } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import {
  useUpdateClassSchema,
  type UpdateClassInput,
} from "../../hooks/use-class-schemas"
import { TermDetailsPreview } from "../term-details-preview"
import { ClassScheduleWizard } from "../class-schedule-wizard"
import { ScheduleDetailsPreview } from "../schedule-details-preview"

export interface EditClassModalProps {
  cls: ClassDto | null
  open: boolean
  onClose: () => void
}

export function EditClassModal({ cls, open, onClose }: EditClassModalProps) {
  const t = useTranslations("classes")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const updateClassSchema = useUpdateClassSchema()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
  })

  const termOptions = React.useMemo(
    () => terms.map((tm) => ({ value: tm.id, label: tm.title })),
    [terms]
  )

  const { data: courseOptions = [] } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (courses) => courses.map((c) => ({ value: c.id, label: c.title })),
  })

  const { data: branchOptions = [] } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
    select: (branches) => branches.map((b) => ({ value: b.id, label: b.name })),
  })

  const { data: classrooms = [] } = useQuery({
    ...classroomsResource.list.toQuery(queryParams),
    enabled: open && !!activeInstituteId,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateClassInput>({
    resolver: zodResolver(updateClassSchema),
    defaultValues: {
      title: "",
      termId: "",
      courseId: "",
      branchId: null,
      classroomId: null,
      capacity: 15,
      fee: 0,
      teacherName: "",
      schedule: "",
      daysOfWeek: [],
      sessionDates: [],
      startTime: null,
      endTime: null,
    },
  })

  const [isScheduleWizardOpen, setIsScheduleWizardOpen] = React.useState(false)
  const currentSchedule = watch("schedule")

  const selectedTermId = watch("termId")
  const selectedTerm = React.useMemo(
    () => terms.find((tm) => tm.id === selectedTermId),
    [terms, selectedTermId]
  )

  const selectedBranchId = watch("branchId")
  const filteredClassrooms = React.useMemo(() => {
    if (!selectedBranchId) {
      return classrooms
    }
    return classrooms.filter(
      (r) => !r.branchId || r.branchId === selectedBranchId
    )
  }, [classrooms, selectedBranchId])

  const classroomOptions = React.useMemo(
    () =>
      filteredClassrooms.map((r) => ({
        value: r.id,
        label: `${r.name} (${r.capacity} ${t("editModal.capacity") || "نفر"})`,
      })),
    [filteredClassrooms, t]
  )

  const selectedClassroomId = watch("classroomId")
  const selectedClassroom = React.useMemo(
    () => classrooms.find((r) => r.id === selectedClassroomId),
    [classrooms, selectedClassroomId]
  )
  const classCapacity = watch("capacity") || 0
  const isCapacityExceeded = Boolean(
    selectedClassroom && classCapacity > selectedClassroom.capacity
  )

  // When selected branch changes, clear classroomId if room belongs to another branch
  React.useEffect(() => {
    if (selectedClassroomId && selectedBranchId) {
      const room = classrooms.find((r) => r.id === selectedClassroomId)
      if (room && room.branchId && room.branchId !== selectedBranchId) {
        setValue("classroomId", null)
      }
    }
  }, [selectedBranchId, selectedClassroomId, classrooms, setValue])

  React.useEffect(() => {
    if (cls) {
      reset({
        title: cls.title,
        termId: cls.termId,
        courseId: cls.courseId,
        branchId: cls.branchId || null,
        classroomId: cls.classroomId || null,
        capacity: cls.capacity,
        fee: cls.fee,
        teacherName: cls.teacherName || "",
        schedule: cls.schedule || "",
        daysOfWeek: cls.daysOfWeek || [],
        sessionDates: cls.sessionDates || [],
        startTime: cls.startTime || null,
        endTime: cls.endTime || null,
      })
    }
  }, [cls, reset])

  const updateMutation = useMutation({
    ...classesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: classesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: UpdateClassInput) => {
    if (!cls) return
    updateMutation.mutate({
      id: cls.id,
      body: {
        ...values,
        classroomId:
          values.classroomId === "NONE" ? null : values.classroomId || null,
      },
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel>{t("editModal.classTitle")}</FieldLabel>
              <Input
                {...register("title")}
                placeholder={t("editModal.titlePlaceholder")}
              />
              <FieldError>{errors.title?.message}</FieldError>
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.termId)}>
                <FieldLabel>{t("editModal.term")}</FieldLabel>
                <Controller
                  control={control}
                  name="termId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={termOptions}
                      value={field.value || ""}
                      onValueChange={(val) => field.onChange(val || "")}
                      placeholder={t("editModal.term")}
                      drawerTitle={t("editModal.term")}
                      className="w-full"
                    />
                  )}
                />
                <FieldError>{errors.termId?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.courseId)}>
                <FieldLabel>{t("editModal.course")}</FieldLabel>
                <Controller
                  control={control}
                  name="courseId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={courseOptions}
                      value={field.value || ""}
                      onValueChange={(val) => field.onChange(val || "")}
                      placeholder={t("editModal.course")}
                      drawerTitle={t("editModal.course")}
                      className="w-full"
                    />
                  )}
                />
                <FieldError>{errors.courseId?.message}</FieldError>
              </Field>
            </div>

            {/* Selected Term Details Preview */}
            <TermDetailsPreview term={selectedTerm} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Branch (Optional) */}
              <Field data-invalid={Boolean(errors.branchId)}>
                <FieldLabel>{t("editModal.branch")}</FieldLabel>
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={branchOptions}
                      value={field.value || ""}
                      onValueChange={(val) => field.onChange(val || null)}
                      placeholder={t("editModal.branchPlaceholder")}
                      drawerTitle={t("editModal.branch")}
                      className="w-full"
                    />
                  )}
                />
                <FieldError>{errors.branchId?.message}</FieldError>
              </Field>

              {/* Classroom (Optional) */}
              <Field data-invalid={Boolean(errors.classroomId)}>
                <FieldLabel>{t("editModal.classroom")}</FieldLabel>
                <Controller
                  control={control}
                  name="classroomId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={classroomOptions}
                      value={field.value || ""}
                      onValueChange={(val) => field.onChange(val || null)}
                      placeholder={t("editModal.classroomPlaceholder")}
                      drawerTitle={t("editModal.classroom")}
                      className="w-full"
                    />
                  )}
                />
                <FieldError>{errors.classroomId?.message}</FieldError>
              </Field>
            </div>

            {/* Classroom Capacity Warning */}
            {isCapacityExceeded && selectedClassroom && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  {t("editModal.capacityWarning", {
                    classCapacity,
                    roomCapacity: selectedClassroom.capacity,
                  })}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.capacity)}>
                <FieldLabel>{t("editModal.capacity")}</FieldLabel>
                <Input
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                  className="font-mono"
                />
                <FieldError>{errors.capacity?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.fee)}>
                <FieldLabel>{t("editModal.fee")}</FieldLabel>
                <Controller
                  control={control}
                  name="fee"
                  render={({ field }) => (
                    <PriceInput
                      value={field.value}
                      onValueChange={(val) => field.onChange(val ?? 0)}
                      placeholder="1,500,000"
                    />
                  )}
                />
                <FieldError>{errors.fee?.message}</FieldError>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.teacherName)}>
                <FieldLabel>{t("editModal.teacherName")}</FieldLabel>
                <Input {...register("teacherName")} />
                <FieldError>{errors.teacherName?.message}</FieldError>
              </Field>

              <Field
                data-invalid={Boolean(errors.schedule)}
                className="min-w-0"
              >
                <FieldLabel>{t("editModal.schedule")}</FieldLabel>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsScheduleWizardOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setIsScheduleWizardOpen(true)
                    }
                  }}
                  className={cn(
                    "flex h-14 w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-border bg-background px-4 text-base shadow-2xs transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
                    errors.schedule &&
                      "border-destructive ring-1 ring-destructive"
                  )}
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm sm:text-base",
                      currentSchedule
                        ? "font-medium text-foreground"
                        : "text-muted-foreground/45"
                    )}
                  >
                    {currentSchedule || t("scheduleWizard.noScheduleSet")}
                  </span>
                  <CalendarIcon className="size-5 shrink-0 text-muted-foreground" />
                </div>
                <FieldError>{errors.schedule?.message}</FieldError>
              </Field>
            </div>

            {/* Schedule Details Preview */}
            <ScheduleDetailsPreview
              daysOfWeek={watch("daysOfWeek")}
              sessionDates={watch("sessionDates")}
              startTime={watch("startTime")}
              endTime={watch("endTime")}
              schedule={currentSchedule}
            />
          </div>

          <ClassScheduleWizard
            open={isScheduleWizardOpen}
            onClose={() => setIsScheduleWizardOpen(false)}
            term={selectedTerm}
            instituteId={
              activeInstituteId || selectedTerm?.instituteId || cls?.instituteId
            }
            classroomId={watch("classroomId")}
            teacherName={watch("teacherName")}
            excludeClassId={cls?.id}
            initialDaysOfWeek={watch("daysOfWeek") || []}
            initialSessionDates={watch("sessionDates") || []}
            initialStartTime={watch("startTime")}
            initialEndTime={watch("endTime")}
            onConfirm={(data) => {
              setValue("daysOfWeek", data.daysOfWeek)
              setValue("sessionDates", data.sessionDates)
              setValue("startTime", data.startTime)
              setValue("endTime", data.endTime)
              setValue("schedule", data.formattedSchedule, {
                shouldValidate: true,
              })
            }}
          />

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
              disabled={updateMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {t("editModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
