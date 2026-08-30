"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Building2,
  Palette,
  Phone,
  CreditCard,
  Plus,
  Trash2,
  Check,
  Package,
} from "lucide-react"
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
import { Spinner } from "@workspace/ui/components/spinner"
import { DEFAULT_ENABLED_MODULES } from "@workspace/types"
import { cn } from "@workspace/ui/lib/utils"
import { institutesResource } from "@/lib/api"
import {
  useCreateInstituteSchema,
  type CreateInstituteInput,
} from "../../hooks/use-institute-schemas"
import { ModulesSelector } from "../modules-selector"

export interface CreateInstituteModalProps {
  open: boolean
  onClose: () => void
}

const BRAND_COLOR_PRESETS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Sky", value: "#0284c7" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Teal", value: "#0d9488" },
  { name: "Slate", value: "#475569" },
]

export function CreateInstituteModal({
  open,
  onClose,
}: CreateInstituteModalProps) {
  const t = useTranslations("institutes")
  const queryClient = useQueryClient()
  const createInstituteSchema = useCreateInstituteSchema()

  const [activeTab, setActiveTab] = React.useState<
    "general" | "modules" | "contact" | "banking"
  >("general")

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<CreateInstituteInput>({
    resolver: zodResolver(createInstituteSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      isActive: true,
      enabledModules: [...DEFAULT_ENABLED_MODULES],
      logo: null,
      logoUrl: null,
      primaryColor: "#10b981",
      address: "",
      phones: [""],
      bankAccountName: "",
      bankCardNumber: "",
      bankShaba: "",
    },
  })

  const phones = watch("phones") || [""]

  const handleAddPhone = () => {
    const current = getValues("phones") || []
    setValue("phones", [...current, ""])
  }

  const handleRemovePhone = (index: number) => {
    const current = getValues("phones") || []
    setValue(
      "phones",
      current.filter((_, i) => i !== index)
    )
  }

  const selectedColor = watch("primaryColor") || "#10b981"

  React.useEffect(() => {
    if (open) {
      reset({
        name: "",
        subdomain: "",
        isActive: true,
        enabledModules: [...DEFAULT_ENABLED_MODULES],
        logo: null,
        logoUrl: null,
        primaryColor: "#10b981",
        address: "",
        phones: [""],
        bankAccountName: "",
        bankCardNumber: "",
        bankShaba: "",
      })
      setActiveTab("general")
    }
  }, [open, reset])

  const createMutation = useMutation({
    ...institutesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const handleNextStep = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (activeTab === "general") {
      const isValid = await trigger(["name", "subdomain", "primaryColor"])
      if (isValid) {
        setActiveTab("modules")
      }
    } else if (activeTab === "modules") {
      setActiveTab("contact")
    } else if (activeTab === "contact") {
      setActiveTab("banking")
    }
  }

  const onSubmit = (values: CreateInstituteInput) => {
    // Guard: Prevent submission if not on the final tab
    if (activeTab !== "banking") {
      return
    }

    createMutation.mutate({
      ...values,
      phones: values.phones ? values.phones.filter(Boolean) : [],
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const target = e.target as HTMLElement
              if (target.tagName !== "TEXTAREA") {
                e.preventDefault()
                if (activeTab !== "banking") {
                  void handleNextStep()
                }
              }
            }
          }}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Step Navigation Tabs */}
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-muted/60 p-1 sm:grid-cols-4">
              <Button
                type="button"
                variant={activeTab === "general" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("general")}
                className={cn(
                  "flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
                  activeTab === "general"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">
                  {t("createModal.sectionGeneral")}
                </span>
              </Button>

              <Button
                type="button"
                variant={activeTab === "modules" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("modules")}
                className={cn(
                  "flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
                  activeTab === "modules"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Package className="size-3.5 shrink-0" />
                <span className="truncate">
                  {t("createModal.sectionModules")}
                </span>
              </Button>

              <Button
                type="button"
                variant={activeTab === "contact" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("contact")}
                className={cn(
                  "flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
                  activeTab === "contact"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Phone className="size-3.5 shrink-0" />
                <span className="truncate">
                  {t("createModal.sectionContact")}
                </span>
              </Button>

              <Button
                type="button"
                variant={activeTab === "banking" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("banking")}
                className={cn(
                  "flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
                  activeTab === "banking"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CreditCard className="size-3.5 shrink-0" />
                <span className="truncate">
                  {t("createModal.sectionBanking")}
                </span>
              </Button>
            </div>

            {/* TAB 1: General & Branding */}
            <div
              className={cn("space-y-4", activeTab !== "general" && "hidden")}
            >
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel>{t("createModal.name")}</FieldLabel>
                <Input
                  {...register("name")}
                  placeholder={t("createModal.namePlaceholder")}
                />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.subdomain)}>
                <FieldLabel>{t("createModal.subdomain")}</FieldLabel>
                <div className="relative flex items-center" dir="ltr">
                  <Input
                    {...register("subdomain")}
                    placeholder={t("createModal.subdomainPlaceholder")}
                    className="pe-28 font-mono placeholder:font-sans"
                  />
                  <span className="pointer-events-none absolute end-3 font-mono text-xs text-muted-foreground select-none">
                    {t("createModal.subdomainSuffix")}
                  </span>
                </div>
                <FieldError>{errors.subdomain?.message}</FieldError>
              </Field>

              {/* Logo Upload */}
              <Field>
                <FieldLabel>{t("createModal.logo")}</FieldLabel>
                <Controller
                  control={control}
                  name="logo"
                  render={({ field }) => (
                    <Attachment
                      value={field.value}
                      onChange={(file) => field.onChange(file)}
                      placeholder={t("createModal.logoPlaceholder")}
                      description={t("createModal.logoDescription")}
                      removeLabel={t("createModal.removePhone")}
                    />
                  )}
                />
              </Field>

              {/* Primary Brand Color */}
              <Field data-invalid={Boolean(errors.primaryColor)}>
                <div className="flex items-center justify-between">
                  <FieldLabel className="flex items-center gap-1.5">
                    <Palette className="size-4 text-muted-foreground" />
                    <span>{t("createModal.primaryColor")}</span>
                  </FieldLabel>
                  <div
                    className="size-5 rounded-full border border-border shadow-2xs"
                    style={{ backgroundColor: selectedColor }}
                  />
                </div>

                {/* Color presets */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {BRAND_COLOR_PRESETS.map((preset) => {
                    const isPicked =
                      selectedColor.toLowerCase() === preset.value.toLowerCase()
                    return (
                      <Button
                        key={preset.value}
                        type="button"
                        variant="ghost"
                        onClick={() => setValue("primaryColor", preset.value)}
                        className={cn(
                          "relative size-8 cursor-pointer rounded-full p-0 transition-transform hover:scale-110",
                          isPicked && "ring-2 ring-foreground ring-offset-2"
                        )}
                        style={{ backgroundColor: preset.value }}
                        aria-label={preset.name}
                      >
                        {isPicked && (
                          <Check className="size-4 text-white drop-shadow-xs" />
                        )}
                      </Button>
                    )
                  })}
                </div>

                {/* Custom Hex input */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("createModal.primaryColorCustom")}:
                  </span>
                  <Input
                    {...register("primaryColor")}
                    placeholder={t("createModal.primaryColorPlaceholder")}
                    className="h-8 max-w-[120px] rounded-lg font-mono text-xs"
                    dir="ltr"
                  />
                </div>
                <FieldError>{errors.primaryColor?.message}</FieldError>
              </Field>
            </div>

            {/* TAB 2: Modules & Subscription Plan */}
            <div
              className={cn("space-y-4", activeTab !== "modules" && "hidden")}
            >
              <Controller
                control={control}
                name="enabledModules"
                render={({ field }) => (
                  <ModulesSelector
                    value={field.value || []}
                    onChange={(mods) => field.onChange(mods)}
                  />
                )}
              />
            </div>

            {/* TAB 3: Contact & Location */}
            <div
              className={cn("space-y-4", activeTab !== "contact" && "hidden")}
            >
              {/* Dynamic Phone Numbers */}
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel className="flex items-center gap-1.5">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{t("createModal.phones")}</span>
                  </FieldLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPhone}
                    className="h-7 cursor-pointer rounded-lg px-2.5 text-xs text-foreground"
                  >
                    <Plus className="me-1 size-3" />
                    {t("createModal.addPhone")}
                  </Button>
                </div>

                <div className="mt-2 space-y-2">
                  {phones.map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        {...register(`phones.${index}` as const)}
                        placeholder={t("createModal.phonePlaceholder")}
                        className="h-10 flex-1 rounded-xl font-mono text-sm placeholder:font-sans"
                        dir="ltr"
                      />
                      {phones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePhone(index)}
                          className="size-9 shrink-0 cursor-pointer rounded-lg p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t("createModal.removePhone")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Field>

              {/* Address */}
              <Field data-invalid={Boolean(errors.address)}>
                <FieldLabel>{t("createModal.address")}</FieldLabel>
                <Input
                  {...register("address")}
                  placeholder={t("createModal.addressPlaceholder")}
                />
                <FieldError>{errors.address?.message}</FieldError>
              </Field>
            </div>

            {/* TAB 3: Banking Info */}
            <div
              className={cn("space-y-4", activeTab !== "banking" && "hidden")}
            >
              <div className="space-y-4">
                <Field data-invalid={Boolean(errors.bankAccountName)}>
                  <FieldLabel>{t("createModal.bankAccountName")}</FieldLabel>
                  <Input
                    {...register("bankAccountName")}
                    placeholder={t("createModal.bankAccountNamePlaceholder")}
                  />
                  <FieldError>{errors.bankAccountName?.message}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.bankCardNumber)}>
                  <FieldLabel>{t("createModal.bankCardNumber")}</FieldLabel>
                  <Input
                    {...register("bankCardNumber")}
                    placeholder={t("createModal.bankCardNumberPlaceholder")}
                    className="font-mono"
                    dir="ltr"
                  />
                  <FieldError>{errors.bankCardNumber?.message}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.bankShaba)}>
                  <FieldLabel>{t("createModal.bankShaba")}</FieldLabel>
                  <Input
                    {...register("bankShaba")}
                    placeholder={t("createModal.bankShabaPlaceholder")}
                    className="font-mono"
                    dir="ltr"
                  />
                  <FieldError>{errors.bankShaba?.message}</FieldError>
                </Field>
              </div>
            </div>
          </div>

          {/* Modal Action Footer */}
          <FormDialogFooter className="justify-between">
            <div className="flex items-center gap-2">
              {activeTab !== "general" && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setActiveTab(
                      activeTab === "banking"
                        ? "contact"
                        : activeTab === "contact"
                          ? "modules"
                          : "general"
                    )
                  }
                  className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium text-muted-foreground"
                >
                  {t("createModal.prev")}
                </Button>
              )}
            </div>

            <div className="flex flex-1 items-center justify-end gap-3 sm:flex-initial [&>button]:w-full [&>button]:min-w-0 [&>button]:flex-1 [&>button]:px-3 sm:[&>button]:w-auto sm:[&>button]:flex-initial sm:[&>button]:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
              >
                {t("createModal.cancel")}
              </Button>

              {activeTab !== "banking" ? (
                <Button
                  key="btn-next-step"
                  type="button"
                  onClick={handleNextStep}
                  className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {t("createModal.next")}
                </Button>
              ) : (
                <Button
                  key="btn-submit-form"
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {createMutation.isPending ? (
                    <>
                      <Spinner className="me-2 size-5 text-primary-foreground" />
                      {t("createModal.submitting")}
                    </>
                  ) : (
                    t("createModal.submit")
                  )}
                </Button>
              )}
            </div>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
