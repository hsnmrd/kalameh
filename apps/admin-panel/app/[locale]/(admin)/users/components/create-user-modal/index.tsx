"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { PasswordInput } from "@workspace/ui/components/password-input"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@workspace/ui/components/field"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { ROLES, type Role } from "@workspace/types"
import { authResource, usersResource } from "@/lib/api"
import {
  useCreateUserSchema,
  type CreateUserInput,
} from "../../hooks/use-user-schemas"

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
  const { data: currentUser } = useQuery(authResource.me.toQuery())

  const roleOptions: ComboboxOption[] = React.useMemo(() => {
    if (currentUser?.role === ROLES.SUPER_ADMIN) {
      return [
        { value: ROLES.STUDENT, label: t("roles.STUDENT") },
        { value: ROLES.CLERK, label: t("roles.CLERK") },
        { value: ROLES.INSTITUTE_ADMIN, label: t("roles.INSTITUTE_ADMIN") },
      ]
    }
    if (currentUser?.role === ROLES.INSTITUTE_ADMIN) {
      return [
        { value: ROLES.STUDENT, label: t("roles.STUDENT") },
        { value: ROLES.CLERK, label: t("roles.CLERK") },
      ]
    }
    return [{ value: ROLES.STUDENT, label: t("roles.STUDENT") }]
  }, [currentUser?.role, t])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      nationalCode: "",
      role: ROLES.STUDENT,
      password: "",
    },
  })

  const createMutation = useMutation({
    ...usersResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: usersResource.list.baseKey(),
      })
      reset()
      onClose()
    },
  })

  const onSubmit = (values: CreateUserInput) => {
    createMutation.mutate({
      ...values,
      instituteId: instituteId || values.instituteId || undefined,
      nationalCode: values.nationalCode || undefined,
      password: values.password || undefined,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("createModal.title")}</DialogTitle>
          <DialogDescription>{t("createModal.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={Boolean(errors.firstName)}>
              <FieldLabel>{t("createModal.firstName")}</FieldLabel>
              <Input
                {...register("firstName")}
                className="h-10 rounded-xl"
                placeholder="علی"
              />
              <FieldError>{errors.firstName?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.lastName)}>
              <FieldLabel>{t("createModal.lastName")}</FieldLabel>
              <Input
                {...register("lastName")}
                className="h-10 rounded-xl"
                placeholder="محمدی"
              />
              <FieldError>{errors.lastName?.message}</FieldError>
            </Field>
          </div>

          {/* Phone Number */}
          <Field data-invalid={Boolean(errors.phone)}>
            <FieldLabel>{t("createModal.phone")}</FieldLabel>
            <Input
              type="tel"
              dir="ltr"
              {...register("phone")}
              className="h-10 rounded-xl text-start font-mono"
              placeholder="09123456789"
            />
            <FieldError>{errors.phone?.message}</FieldError>
          </Field>

          {/* National Code */}
          <Field data-invalid={Boolean(errors.nationalCode)}>
            <FieldLabel>{t("createModal.nationalCode")}</FieldLabel>
            <Input
              type="text"
              dir="ltr"
              {...register("nationalCode")}
              className="h-10 rounded-xl text-start font-mono"
              placeholder="0012345678"
            />
            <FieldError>{errors.nationalCode?.message}</FieldError>
          </Field>

          {/* Role Selection via Combobox (only showing authorized roles) */}
          <Field data-invalid={Boolean(errors.role)}>
            <FieldLabel>{t("createModal.role")}</FieldLabel>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Combobox
                  items={roleOptions}
                  value={field.value}
                  onValueChange={(val) =>
                    field.onChange((val as Role) || ROLES.STUDENT)
                  }
                  placeholder={t("createModal.role")}
                  data-invalid={Boolean(errors.role)}
                />
              )}
            />
            <FieldError>{errors.role?.message}</FieldError>
          </Field>

          {/* Initial Password */}
          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel>{t("createModal.password")}</FieldLabel>
            <PasswordInput
              {...register("password")}
              className="h-10 rounded-xl"
              placeholder="••••••••"
            />
            <FieldDescription>{t("createModal.passwordHint")}</FieldDescription>
            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-xl"
            >
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              <span>{t("createModal.submit")}</span>
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
