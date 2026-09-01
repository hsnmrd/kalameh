"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { classroomsResource } from "@/lib/api"
import {
  createUpdateClassroomSchema,
  type UpdateClassroomInput,
  type ClassroomDto,
  type BranchWithStats,
} from "@workspace/types"

export interface EditClassroomModalProps {
  classroom: ClassroomDto | null
  open: boolean
  onClose: () => void
  branches: BranchWithStats[]
}

export function EditClassroomModal({
  classroom,
  open,
  onClose,
  branches,
}: EditClassroomModalProps) {
  const t = useTranslations("classrooms")
  const queryClient = useQueryClient()

  const classroomSchema = React.useMemo(() => {
    return createUpdateClassroomSchema({
      nameMin: t("editModal.namePlaceholder"),
      capacityMin: t("editModal.capacityPlaceholder"),
    })
  }, [t])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateClassroomInput>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: "",
      capacity: 20,
      branchId: null,
      description: "",
      isActive: true,
    },
  })

  React.useEffect(() => {
    if (classroom) {
      reset({
        name: classroom.name,
        capacity: classroom.capacity,
        branchId: classroom.branchId || null,
        description: classroom.description || "",
        isActive: classroom.isActive,
      })
    }
  }, [classroom, reset])

  const branchOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "NONE", label: t("editModal.noBranch") },
      ...branches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    ]
  }, [branches, t])

  const updateMutation = useMutation({
    ...classroomsResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: classroomsResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (data: UpdateClassroomInput) => {
    if (!classroom) return
    updateMutation.mutate({
      id: classroom.id,
      body: {
        ...data,
        branchId: data.branchId === "NONE" ? null : data.branchId || null,
      },
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && onClose()}>
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
            <Field>
              <FieldLabel>{t("editModal.name")}</FieldLabel>
              <Input
                {...register("name")}
                placeholder={t("editModal.namePlaceholder")}
                className="h-12 rounded-xl text-base"
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("editModal.branch")}</FieldLabel>
                <Controller
                  control={control}
                  name="branchId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={branchOptions}
                      value={field.value || "NONE"}
                      onValueChange={(val) =>
                        field.onChange(val === "NONE" ? null : val)
                      }
                      placeholder={t("editModal.branchPlaceholder")}
                    />
                  )}
                />
                {errors.branchId && (
                  <FieldError>{errors.branchId.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>{t("editModal.capacity")}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  {...register("capacity", { valueAsNumber: true })}
                  placeholder={t("editModal.capacityPlaceholder")}
                  className="h-12 rounded-xl text-base"
                />
                {errors.capacity && (
                  <FieldError>{errors.capacity.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>{t("editModal.description")}</FieldLabel>
              <Input
                {...register("description")}
                placeholder={t("editModal.descriptionPlaceholder")}
                className="h-12 rounded-xl text-base"
              />
              {errors.description && (
                <FieldError>{errors.description.message}</FieldError>
              )}
            </Field>

            <div className="flex items-center gap-3 pt-1">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Checkbox
                    id="edit-classroom-is-active"
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="edit-classroom-is-active"
                className="cursor-pointer text-sm font-medium text-foreground select-none"
              >
                {t("editModal.isActive")}
              </label>
            </div>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 min-w-24 rounded-xl px-5 text-base font-medium"
            >
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-12 min-w-28 rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              {t("editModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
