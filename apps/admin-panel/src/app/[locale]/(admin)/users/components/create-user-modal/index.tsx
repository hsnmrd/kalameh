"use client"

import * as React from "react"
import { CheckCircle2, UserPlus } from "lucide-react"
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
import { PasswordInput } from "@workspace/ui/components/password-input"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { ROLES, type Role } from "@workspace/types"
import { usersResource } from "@/lib/api"
import {
  useCreateUserSchema,
  type CreateUserInput,
} from "../../hooks/use-user-schemas"
import { useUserLookup } from "../../hooks/use-user-lookup"

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      nationalCode: "",
      role: ROLES.CLERK,
      password: "",
    },
  })

  // Live Lookup Logic
  const { lookupData, isLookingUp, shouldQuery, resetLookup } = useUserLookup({
    open,
    watch,
    setValue,
  })

  const createMutation = useMutation({
    ...usersResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: usersResource.list.baseKey(),
      })
      resetLookup()
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
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Lookup Status Banner */}
            {isLookingUp && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Spinner className="size-3 text-muted-foreground" />
                <span>{t("createModal.lookupChecking")}</span>
              </div>
            )}
            {lookupData?.found && !isLookingUp && (
              <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                <span>{t("createModal.lookupFound")}</span>
              </div>
            )}
            {shouldQuery && !isLookingUp && lookupData && !lookupData.found && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <UserPlus className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{t("createModal.lookupNew")}</span>
              </div>
            )}

            {/* National Code */}
            <Field data-invalid={Boolean(errors.nationalCode)}>
              <FieldLabel>{t("createModal.nationalCode")}</FieldLabel>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                dir="ltr"
                {...register("nationalCode")}
                className="text-start font-mono"
                placeholder={t("createModal.nationalCodePlaceholder")}
              />
              <FieldError>{errors.nationalCode?.message}</FieldError>
            </Field>

            {/* Phone Number */}
            <Field data-invalid={Boolean(errors.phone)}>
              <FieldLabel htmlFor="new-user-phone">
                {t("createModal.phone")}
              </FieldLabel>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input
                    {...field}
                    id="new-user-phone"
                    name="new-user-phone"
                    type="tel"
                    dir="ltr"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    className="text-start font-mono"
                    placeholder={t("createModal.phonePlaceholder")}
                  />
                )}
              />
              <FieldError>{errors.phone?.message}</FieldError>
            </Field>

            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={Boolean(errors.firstName)}>
                <FieldLabel>{t("createModal.firstName")}</FieldLabel>
                <Input
                  {...register("firstName")}
                  placeholder={t("createModal.firstNamePlaceholder")}
                />
                <FieldError>{errors.firstName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.lastName)}>
                <FieldLabel>{t("createModal.lastName")}</FieldLabel>
                <Input
                  {...register("lastName")}
                  placeholder={t("createModal.lastNamePlaceholder")}
                />
                <FieldError>{errors.lastName?.message}</FieldError>
              </Field>
            </div>

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
                      field.onChange((val as Role) || ROLES.STUDENT)
                    }
                    placeholder={t("createModal.role")}
                    drawerTitle={t("createModal.role")}
                    data-invalid={Boolean(errors.role)}
                  />
                )}
              />
              <FieldError>{errors.role?.message}</FieldError>
            </Field>

            {/* Initial Password */}
            <Field data-invalid={Boolean(errors.password)}>
              <FieldLabel htmlFor="new-user-password">
                {t("createModal.password")}
              </FieldLabel>
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    id="new-user-password"
                    name="new-user-password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    placeholder={t("createModal.passwordPlaceholder")}
                  />
                )}
              />
              <FieldDescription>
                {t("createModal.passwordHint")}
              </FieldDescription>
              <FieldError>{errors.password?.message}</FieldError>
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
