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
import { ROLES, type Role } from "@workspace/types"
import { usersResource } from "@/lib/api"
import {
  type CreateUserInput,
  useCreateUserSchema,
} from "../../hooks/use-user-schemas"
import { useUserLookup } from "../../hooks/use-user-lookup"
import { FormFields } from "./form-fields"

export interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  instituteId?: string
}

export function CreateUserModal({
  open,
  onClose,
  instituteId,
}: CreateUserModalProps) {
  const t = useTranslations("users")
  const queryClient = useQueryClient()
  const createUserSchema = useCreateUserSchema()
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

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      avatar: null,
      avatarUrl: null,
      firstName: "",
      lastName: "",
      phone: "",
      nationalCode: "",
      role: ROLES.CLERK,
      password: "",
    },
  })
  const { handleSubmit, reset, setValue, watch } = form
  const { lookupData, isLookingUp, shouldQuery, resetLookup } = useUserLookup({
    open,
    watch,
    setValue,
  })
  const createMutation = useMutation({
    ...usersResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({ queryKey: usersResource.list.baseKey() })
      resetLookup()
      reset()
      onClose()
    },
  })
  const onSubmit = (values: CreateUserInput) =>
    createMutation.mutate({
      ...values,
      avatar: values.avatar || undefined,
      avatarUrl: values.avatarUrl || undefined,
      instituteId: instituteId || values.instituteId || undefined,
      nationalCode: values.nationalCode || undefined,
      password: values.password || undefined,
    })
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetLookup()
      reset()
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
          data-form-type="other"
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <FormFields
              form={form}
              roleOptions={roleOptions}
              isLookingUp={isLookingUp}
              lookupData={lookupData}
              shouldQuery={shouldQuery}
            />
          </div>
          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              <span>{t("createModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
