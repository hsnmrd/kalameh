"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import type { ComboboxOption } from "@workspace/ui/components/combobox"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { ROLES, type AuthUser, type Role } from "@workspace/types"
import { usersResource } from "@/lib/api"
import {
  type UpdateUserInput,
  useUpdateUserSchema,
} from "../../hooks/use-user-schemas"
import { FormFields } from "./form-fields"

export interface EditUserModalProps {
  user: AuthUser | null
  open: boolean
  onClose: () => void
}

export function EditUserModal({ user, open, onClose }: EditUserModalProps) {
  const t = useTranslations("users")
  const queryClient = useQueryClient()
  const roleOptions: ComboboxOption[] = React.useMemo(() => {
    const roles: Role[] = [
      ROLES.ADMIN,
      ROLES.ASSISTANT,
      ROLES.SUPERVISOR,
      ROLES.SUPER_CLERK,
      ROLES.CLERK,
    ]
    return roles.map((role) => ({ value: role, label: t(`roles.${role}`) }))
  }, [t])
  const statusOptions: ComboboxOption[] = React.useMemo(
    () => [
      { value: "true", label: t("status.active") },
      { value: "false", label: t("status.inactive") },
    ],
    [t]
  )
  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(useUpdateUserSchema()),
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
  const { handleSubmit, reset } = form
  React.useEffect(() => {
    if (user)
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
  }, [user, reset])
  const updateMutation = useMutation({
    ...usersResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({ queryKey: usersResource.list.baseKey() })
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

  return (
    <FormDialog open={open} onOpenChange={(value) => !value && onClose()}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <FormFields
              form={form}
              roleOptions={roleOptions}
              statusOptions={statusOptions}
            />
          </div>
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
              <span>{t("editModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
