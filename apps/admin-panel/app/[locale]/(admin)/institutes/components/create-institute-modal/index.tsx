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
} from "lucide-react"
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
import { Attachment } from "@workspace/ui/components/attachment"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { institutesResource } from "@/lib/api"
import {
  useCreateInstituteSchema,
  type CreateInstituteInput,
} from "../../hooks/use-institute-schemas"

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
    "general" | "contact" | "banking"
  >("general")

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateInstituteInput>({
    resolver: zodResolver(createInstituteSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      isActive: true,
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

  const onSubmit = (values: CreateInstituteInput) => {
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogCloseButton />

        <div className="p-6 pb-4">
          <DialogHeader className="text-start">
            <DialogTitle>{t("createModal.title")}</DialogTitle>
            <DialogDescription>
              {t("createModal.description")}
            </DialogDescription>
          </DialogHeader>

          {/* Step Navigation Tabs */}
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-muted/60 p-1">
            <Button
              type="button"
              variant={activeTab === "general" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("general")}
              className={cn(
                "flex-1 cursor-pointer rounded-lg text-xs font-semibold transition-all",
                activeTab === "general"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="me-1.5 size-3.5" />
              {t("createModal.sectionGeneral")}
            </Button>

            <Button
              type="button"
              variant={activeTab === "contact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("contact")}
              className={cn(
                "flex-1 cursor-pointer rounded-lg text-xs font-semibold transition-all",
                activeTab === "contact"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Phone className="me-1.5 size-3.5" />
              {t("createModal.sectionContact")}
            </Button>

            <Button
              type="button"
              variant={activeTab === "banking" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("banking")}
              className={cn(
                "flex-1 cursor-pointer rounded-lg text-xs font-semibold transition-all",
                activeTab === "banking"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CreditCard className="me-1.5 size-3.5" />
              {t("createModal.sectionBanking")}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 pb-6">
          {/* TAB 1: General & Branding */}
          <div className={cn("space-y-4", activeTab !== "general" && "hidden")}>
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel>{t("createModal.name")}</FieldLabel>
              <Input
                {...register("name")}
                placeholder={t("createModal.namePlaceholder")}
                className="h-10 rounded-xl"
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.subdomain)}>
              <FieldLabel>{t("createModal.subdomain")}</FieldLabel>
              <div className="relative flex items-center" dir="ltr">
                <Input
                  {...register("subdomain")}
                  placeholder={t("createModal.subdomainPlaceholder")}
                  className="h-10 rounded-xl pe-28 font-mono text-sm placeholder:font-sans"
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

          {/* TAB 2: Contact & Location */}
          <div className={cn("space-y-4", activeTab !== "contact" && "hidden")}>
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
                className="h-10 rounded-xl"
              />
              <FieldError>{errors.address?.message}</FieldError>
            </Field>
          </div>

          {/* TAB 3: Banking Info */}
          <div className={cn("space-y-4", activeTab !== "banking" && "hidden")}>
            <div className="space-y-4">
              <Field data-invalid={Boolean(errors.bankAccountName)}>
                <FieldLabel>{t("createModal.bankAccountName")}</FieldLabel>
                <Input
                  {...register("bankAccountName")}
                  placeholder={t("createModal.bankAccountNamePlaceholder")}
                  className="h-10 rounded-xl"
                />
                <FieldError>{errors.bankAccountName?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.bankCardNumber)}>
                <FieldLabel>{t("createModal.bankCardNumber")}</FieldLabel>
                <Input
                  {...register("bankCardNumber")}
                  placeholder={t("createModal.bankCardNumberPlaceholder")}
                  className="h-10 rounded-xl font-mono text-sm"
                  dir="ltr"
                />
                <FieldError>{errors.bankCardNumber?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.bankShaba)}>
                <FieldLabel>{t("createModal.bankShaba")}</FieldLabel>
                <Input
                  {...register("bankShaba")}
                  placeholder={t("createModal.bankShabaPlaceholder")}
                  className="h-10 rounded-xl font-mono text-sm"
                  dir="ltr"
                />
                <FieldError>{errors.bankShaba?.message}</FieldError>
              </Field>
            </div>
          </div>

          {/* Modal Action Footer */}
          <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
            <div className="flex items-center gap-2">
              {activeTab !== "general" && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setActiveTab(
                      activeTab === "banking" ? "contact" : "general"
                    )
                  }
                  className="h-10 rounded-xl px-4 text-xs font-semibold text-muted-foreground"
                >
                  {t("createModal.prev")}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 rounded-xl px-4 text-xs font-semibold"
              >
                {t("createModal.cancel")}
              </Button>

              {activeTab !== "banking" ? (
                <Button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      activeTab === "general" ? "contact" : "banking"
                    )
                  }
                  className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {t("createModal.next")}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {createMutation.isPending ? (
                    <>
                      <Spinner className="me-2 size-4 text-primary-foreground" />
                      {t("createModal.submitting")}
                    </>
                  ) : (
                    t("createModal.submit")
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
