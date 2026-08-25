"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogDescription,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useCreateBranchSchema,
  type CreateBranchInput,
} from "../../hooks/use-branch-schemas"

export interface CreateBranchModalProps {
  open: boolean
  onClose: () => void
}

export function CreateBranchModal({ open, onClose }: CreateBranchModalProps) {
  const t = useTranslations("branches")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const createBranchSchema = useCreateBranchSchema()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateBranchInput>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: {
      name: "",
      address: "",
      phones: [""],
      isActive: true,
    },
  })

  const phones = watch("phones") || [""]

  const handleAddPhone = () => {
    const current = getValues("phones") || []
    setValue("phones", [...current, ""])
  }

  const handleRemovePhone = (index: number) => {
    const current = getValues("phones") || []
    if (current.length === 1) {
      setValue("phones", [""])
      return
    }
    setValue(
      "phones",
      current.filter((_, i) => i !== index)
    )
  }

  const createMutation = useMutation({
    ...branchesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: branchesResource.list.baseKey(),
      })
      reset()
      onClose()
    },
  })

  const onSubmit = (values: CreateBranchInput) => {
    const cleanedPhones = (values.phones || [])
      .map((p) => p.trim())
      .filter(Boolean)

    createMutation.mutate({
      ...values,
      address: values.address?.trim() || null,
      phones: cleanedPhones,
      instituteId: activeInstituteId || undefined,
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset()
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="max-w-lg">
        <FormDialogHeader>
          <div className="space-y-1">
            <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
            <FormDialogDescription>
              {t("createModal.description")}
            </FormDialogDescription>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-6 sm:px-0 sm:py-0">
            {/* Branch Name */}
            <Field>
              <FieldLabel>{t("createModal.branchName")}</FieldLabel>
              <Input
                {...register("name")}
                placeholder={t("createModal.branchNamePlaceholder")}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>

            {/* Address */}
            <Field>
              <FieldLabel>{t("createModal.address")}</FieldLabel>
              <Input
                {...register("address")}
                placeholder={t("createModal.addressPlaceholder")}
              />
              <FieldError>{errors.address?.message}</FieldError>
            </Field>

            {/* Phones */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>{t("createModal.phones")}</FieldLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddPhone}
                  className="h-8 gap-1 px-2 text-xs text-primary"
                >
                  <Plus className="size-3.5" />
                  {t("createModal.addPhone")}
                </Button>
              </div>

              <div className="space-y-2">
                {phones.map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      {...register(`phones.${index}` as const)}
                      placeholder={t("createModal.phonePlaceholder")}
                      dir="ltr"
                      className="text-start font-mono"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePhone(index)}
                      className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Switch / Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="create-branch-active"
                    checked={field.value ?? true}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                )}
              />
              <label
                htmlFor="create-branch-active"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                {t("createModal.isActive")}
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onClose()
              }}
              disabled={createMutation.isPending}
            >
              {t("createModal.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Spinner className="me-2 size-4" />
              ) : null}
              {t("createModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
