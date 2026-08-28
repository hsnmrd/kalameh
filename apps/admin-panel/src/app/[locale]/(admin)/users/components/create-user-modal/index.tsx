"use client"

import * as React from "react"
import { CheckCircle2, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
  const nationalCodeValue = watch("nationalCode")
  const phoneValue = watch("phone")
  const [debouncedNationalCode, setDebouncedNationalCode] = React.useState("")
  const [debouncedPhone, setDebouncedPhone] = React.useState("")
  const lastAutoFilledIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNationalCode(nationalCodeValue?.trim() || "")
    }, 400)
    return () => clearTimeout(timer)
  }, [nationalCodeValue])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPhone(phoneValue?.trim() || "")
    }, 400)
    return () => clearTimeout(timer)
  }, [phoneValue])

  const shouldQuery =
    open && (debouncedNationalCode.length >= 8 || debouncedPhone.length === 11)

  const { data: lookupData, isFetching: isLookingUp } = useQuery({
    ...usersResource.lookup.toQuery({
      nationalCode:
        debouncedNationalCode.length >= 8 ? debouncedNationalCode : undefined,
      phone: debouncedPhone.length === 11 ? debouncedPhone : undefined,
    }),
    enabled: shouldQuery,
  })

  React.useEffect(() => {
    if (lookupData?.found && lookupData?.user) {
      const user = lookupData.user
      if (lastAutoFilledIdRef.current !== user.id) {
        lastAutoFilledIdRef.current = user.id
        setValue("firstName", user.firstName, { shouldValidate: true })
        setValue("lastName", user.lastName, { shouldValidate: true })
        if (user.phone) {
          setValue("phone", user.phone, { shouldValidate: true })
        }
        if (user.nationalCode) {
          setValue("nationalCode", user.nationalCode, { shouldValidate: true })
        }
        if (
          user.role &&
          user.role !== ROLES.STUDENT &&
          user.role !== ROLES.SUPER_STUDENT
        ) {
          setValue("role", user.role, { shouldValidate: true })
        }
      }
    }
  }, [lookupData, setValue])

  const createMutation = useMutation({
    ...usersResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: usersResource.list.baseKey(),
      })
      lastAutoFilledIdRef.current = null
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
      lastAutoFilledIdRef.current = null
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
          className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-6 sm:px-0 sm:py-0">
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
                dir="ltr"
                {...register("nationalCode")}
                className="text-start font-mono"
                placeholder={t("createModal.nationalCodePlaceholder")}
              />
              <FieldError>{errors.nationalCode?.message}</FieldError>
            </Field>

            {/* Phone Number */}
            <Field data-invalid={Boolean(errors.phone)}>
              <FieldLabel>{t("createModal.phone")}</FieldLabel>
              <Input
                type="tel"
                dir="ltr"
                {...register("phone")}
                className="text-start font-mono"
                placeholder={t("createModal.phonePlaceholder")}
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
              <FieldLabel>{t("createModal.password")}</FieldLabel>
              <PasswordInput
                {...register("password")}
                placeholder={t("createModal.passwordPlaceholder")}
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
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
