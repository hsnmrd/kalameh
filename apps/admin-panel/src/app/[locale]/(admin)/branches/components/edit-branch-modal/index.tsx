"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogCloseButton,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import type { BranchWithStats } from "@workspace/types"
import { branchesResource } from "@/lib/api"
import {
  useUpdateBranchSchema,
  type UpdateBranchInput,
} from "../../hooks/use-branch-schemas"

export interface EditBranchModalProps {
  branch: BranchWithStats | null
  open: boolean
  onClose: () => void
}

export function EditBranchModal({
  branch,
  open,
  onClose,
}: EditBranchModalProps) {
  const t = useTranslations("branches")
  const queryClient = useQueryClient()
  const updateBranchSchema = useUpdateBranchSchema()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<UpdateBranchInput>({
    resolver: zodResolver(updateBranchSchema),
    defaultValues: {
      name: "",
      address: "",
      phones: [""],
      isActive: true,
    },
  })

  React.useEffect(() => {
    if (branch) {
      reset({
        name: branch.name,
        address: branch.address || "",
        phones:
          branch.phones && branch.phones.length > 0 ? branch.phones : [""],
        isActive: branch.isActive,
      })
    }
  }, [branch, reset])

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

  const updateMutation = useMutation({
    ...branchesResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: branchesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: UpdateBranchInput) => {
    if (!branch) return

    const cleanedPhones = (values.phones || [])
      .map((p) => p.trim())
      .filter(Boolean)

    updateMutation.mutate({
      id: branch.id,
      body: {
        ...values,
        address: values.address?.trim() || null,
        phones: cleanedPhones,
      },
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose()
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("editModal.title")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("editModal.description")}
          </ResponsiveDialogDescription>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 px-6 pt-2 pb-6"
        >
          {/* Branch Name */}
          <Field>
            <FieldLabel>{t("editModal.branchName")}</FieldLabel>
            <Input
              {...register("name")}
              placeholder={t("editModal.branchNamePlaceholder")}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>

          {/* Address */}
          <Field>
            <FieldLabel>{t("editModal.address")}</FieldLabel>
            <Input
              {...register("address")}
              placeholder={t("editModal.addressPlaceholder")}
            />
            <FieldError>{errors.address?.message}</FieldError>
          </Field>

          {/* Phones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel>{t("editModal.phones")}</FieldLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddPhone}
                className="h-8 gap-1 px-2 text-xs text-primary"
              >
                <Plus className="size-3.5" />
                {t("editModal.addPhone")}
              </Button>
            </div>

            <div className="space-y-2">
              {phones.map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    {...register(`phones.${index}` as const)}
                    placeholder={t("editModal.phonePlaceholder")}
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
                  id="edit-branch-active"
                  checked={field.value ?? true}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
              )}
            />
            <label
              htmlFor="edit-branch-active"
              className="cursor-pointer text-sm font-medium text-foreground"
            >
              {t("editModal.isActive")}
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              {t("editModal.cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Spinner className="me-2 size-4" />
              ) : null}
              {t("editModal.submit")}
            </Button>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
