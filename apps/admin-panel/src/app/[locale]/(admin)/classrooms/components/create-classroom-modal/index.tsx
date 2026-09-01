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
import { useActiveInstitute } from "@/lib/stores"
import {
  createCreateClassroomSchema,
  type CreateClassroomInput,
  type BranchWithStats,
} from "@workspace/types"

export interface CreateClassroomModalProps {
  open: boolean
  onClose: () => void
  branches: BranchWithStats[]
}

export function CreateClassroomModal({
  open,
  onClose,
  branches,
}: CreateClassroomModalProps) {
  const t = useTranslations("classrooms")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const classroomSchema = React.useMemo(() => {
    return createCreateClassroomSchema({
      nameMin: t("createModal.namePlaceholder"),
      capacityMin: t("createModal.capacityPlaceholder"),
    })
  }, [t])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateClassroomInput>({
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
    if (open) {
      reset({
        name: "",
        capacity: 20,
        branchId: branches.length === 1 ? branches[0]?.id : null,
        description: "",
        isActive: true,
      })
    }
  }, [open, branches, reset])

  const branchOptions: ComboboxOption[] = React.useMemo(() => {
    return [
      { value: "NONE", label: t("createModal.noBranch") },
      ...branches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    ]
  }, [branches, t])

  const createMutation = useMutation({
    ...classroomsResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: classroomsResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (data: CreateClassroomInput) => {
    createMutation.mutate({
      ...data,
      branchId: data.branchId === "NONE" ? null : data.branchId || null,
      instituteId: activeInstituteId || undefined,
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <FormDialogContent className="sm:max-w-lg">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <Field>
              <FieldLabel>{t("createModal.name")}</FieldLabel>
              <Input
                {...register("name")}
                placeholder={t("createModal.namePlaceholder")}
                className="h-12 rounded-xl text-base"
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{t("createModal.branch")}</FieldLabel>
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
                      placeholder={t("createModal.branchPlaceholder")}
                    />
                  )}
                />
                {errors.branchId && (
                  <FieldError>{errors.branchId.message}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>{t("createModal.capacity")}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  {...register("capacity", { valueAsNumber: true })}
                  placeholder={t("createModal.capacityPlaceholder")}
                  className="h-12 rounded-xl text-base"
                />
                {errors.capacity && (
                  <FieldError>{errors.capacity.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel>{t("createModal.description")}</FieldLabel>
              <Input
                {...register("description")}
                placeholder={t("createModal.descriptionPlaceholder")}
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
                    id="create-classroom-is-active"
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <label
                htmlFor="create-classroom-is-active"
                className="cursor-pointer text-sm font-medium text-foreground select-none"
              >
                {t("createModal.isActive")}
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
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-12 min-w-28 rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              {t("createModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
