"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import type { AuthUser } from "@workspace/types"
import { usersResource } from "@/lib/api"
import {
  useUpdateUserSchema,
  type UpdateUserInput,
} from "../../hooks/use-user-schemas"

export interface EditUserModalProps {
  user: AuthUser | null
  open: boolean
  onClose: () => void
}

export function EditUserModal({ user, open, onClose }: EditUserModalProps) {
  const t = useTranslations("users")
  const queryClient = useQueryClient()
  const updateUserSchema = useUpdateUserSchema()

  const statusOptions: ComboboxOption[] = React.useMemo(
    () => [
      { value: "true", label: t("status.active") },
      { value: "false", label: t("status.inactive") },
    ],
    [t]
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      nationalCode: "",
      isActive: true,
    },
  })

  React.useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        nationalCode: user.nationalCode || "",
        isActive: user.isActive,
      })
    }
  }, [user, reset])

  const updateMutation = useMutation({
    ...usersResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: usersResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: UpdateUserInput) => {
    if (!user) return
    updateMutation.mutate({
      id: user.id,
      body: {
        ...values,
        nationalCode: values.nationalCode || null,
      },
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("editModal.title")}</DialogTitle>
          <DialogDescription>{t("editModal.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={Boolean(errors.firstName)}>
              <FieldLabel>{t("editModal.firstName")}</FieldLabel>
              <Input {...register("firstName")} className="h-10 rounded-xl" />
              <FieldError>{errors.firstName?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.lastName)}>
              <FieldLabel>{t("editModal.lastName")}</FieldLabel>
              <Input {...register("lastName")} className="h-10 rounded-xl" />
              <FieldError>{errors.lastName?.message}</FieldError>
            </Field>
          </div>

          {/* Phone Number */}
          <Field data-invalid={Boolean(errors.phone)}>
            <FieldLabel>{t("editModal.phone")}</FieldLabel>
            <Input
              type="tel"
              dir="ltr"
              {...register("phone")}
              className="h-10 rounded-xl text-start font-mono"
            />
            <FieldError>{errors.phone?.message}</FieldError>
          </Field>

          {/* National Code */}
          <Field data-invalid={Boolean(errors.nationalCode)}>
            <FieldLabel>{t("editModal.nationalCode")}</FieldLabel>
            <Input
              type="text"
              dir="ltr"
              {...register("nationalCode")}
              className="h-10 rounded-xl text-start font-mono"
            />
            <FieldError>{errors.nationalCode?.message}</FieldError>
          </Field>

          {/* Account Status via Combobox */}
          <Field>
            <FieldLabel>{t("editModal.isActive")}</FieldLabel>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Combobox
                  items={statusOptions}
                  value={field.value ? "true" : "false"}
                  onValueChange={(val) => field.onChange(val === "true")}
                  placeholder={t("editModal.isActive")}
                />
              )}
            />
          </Field>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-xl"
            >
              {t("editModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              <span>{t("editModal.submit")}</span>
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
