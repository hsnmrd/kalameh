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
import { Attachment } from "@workspace/ui/components/attachment"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { ROLES, type AuthUser, type Role } from "@workspace/types"
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

  const roleOptions: ComboboxOption[] = React.useMemo(() => {
    const staffRoles: Role[] = [
      ROLES.ADMIN,
      ROLES.ASSISTANT,
      ROLES.SUPERVISOR,
      ROLES.SUPER_CLERK,
      ROLES.CLERK,
      ROLES.TEACHER,
    ]

    return staffRoles.map((r) => ({
      value: r,
      label: t(`roles.${r}`),
    }))
  }, [t])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      avatar: null,
      avatarUrl: null,
      firstName: "",
      lastName: "",
      phone: "",
      nationalCode: "",
      role: ROLES.CLERK,
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
        avatar: null,
        avatarUrl: user.avatarUrl || null,
        role: user.role,
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
        avatar: values.avatar || undefined,
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
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-md">
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
              <FieldLabel>{t("editModal.avatar")}</FieldLabel>
              <Controller
                control={control}
                name="avatar"
                render={({ field }) => (
                  <Attachment
                    value={field.value || undefined}
                    onChange={(file) => field.onChange(file)}
                    placeholder={t("createModal.avatarPlaceholder")}
                    description={t("createModal.avatarDescription")}
                    removeLabel={t("createModal.removeAvatar")}
                  />
                )}
              />
            </Field>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={Boolean(errors.firstName)}>
                <FieldLabel>{t("editModal.firstName")}</FieldLabel>
                <Input {...register("firstName")} />
                <FieldError>{errors.firstName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.lastName)}>
                <FieldLabel>{t("editModal.lastName")}</FieldLabel>
                <Input {...register("lastName")} />
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
                className="text-start font-mono"
              />
              <FieldError>{errors.phone?.message}</FieldError>
            </Field>

            {/* National Code */}
            <Field data-invalid={Boolean(errors.nationalCode)}>
              <FieldLabel>{t("editModal.nationalCode")}</FieldLabel>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                dir="ltr"
                {...register("nationalCode")}
                className="text-start font-mono"
              />
              <FieldError>{errors.nationalCode?.message}</FieldError>
            </Field>

            {/* Role Selection via ResponsiveCombobox */}
            <Field data-invalid={Boolean(errors.role)}>
              <FieldLabel>{t("createModal.role")}</FieldLabel>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <ResponsiveCombobox
                    items={roleOptions}
                    value={field.value}
                    onValueChange={(val) =>
                      field.onChange((val as Role) || ROLES.CLERK)
                    }
                    placeholder={t("createModal.role")}
                    drawerTitle={t("createModal.role")}
                    data-invalid={Boolean(errors.role)}
                  />
                )}
              />
              <FieldError>{errors.role?.message}</FieldError>
            </Field>

            {/* Account Status via ResponsiveCombobox */}
            <Field>
              <FieldLabel>{t("editModal.isActive")}</FieldLabel>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <ResponsiveCombobox
                    items={statusOptions}
                    value={field.value ? "true" : "false"}
                    onValueChange={(val) => field.onChange(val === "true")}
                    placeholder={t("editModal.isActive")}
                    drawerTitle={t("editModal.isActive")}
                    searchable={false}
                  />
                )}
              />
            </Field>
          </div>

          {/* Actions */}
          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
              <span>{t("editModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
