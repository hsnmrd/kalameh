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
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Attachment } from "@workspace/ui/components/attachment"
import { Spinner } from "@workspace/ui/components/spinner"
import { DEFAULT_ENABLED_MODULES } from "@workspace/types"
import { cn } from "@workspace/ui/lib/utils"
import type { InstituteWithStats } from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useUpdateInstituteSchema,
  type UpdateInstituteInput,
} from "../../hooks/use-institute-schemas"
import { ModulesSelector } from "../modules-selector"

export interface EditInstituteModalProps {
  open: boolean
  onClose: () => void
  institute: InstituteWithStats | null
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

export function EditInstituteModal({
  open,
  onClose,
  institute,
}: EditInstituteModalProps) {
  const t = useTranslations("institutes")
  const queryClient = useQueryClient()
  const updateInstituteSchema = useUpdateInstituteSchema()
  const { activeInstitute, setActiveInstitute } = useActiveInstitute()

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
    formState: { errors },
  } = useForm<UpdateInstituteInput>({
    resolver: zodResolver(updateInstituteSchema),
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

  React.useEffect(() => {
    if (open && institute) {
      reset({
        name: institute.name,
        subdomain: institute.subdomain,
        isActive: institute.isActive,
        enabledModules: institute.enabledModules || [
          ...DEFAULT_ENABLED_MODULES,
        ],
        logo: null,
        logoUrl: institute.logoUrl || null,
        primaryColor: institute.primaryColor || "#10b981",
        address: institute.address || "",
        phones:
          institute.phones && institute.phones.length > 0
            ? institute.phones
            : [""],
        bankAccountName: institute.bankAccountName || "",
        bankCardNumber: institute.bankCardNumber || "",
        bankShaba: institute.bankShaba || "",
      })
      setActiveTab("general")
    }
  }, [open, institute, reset])

  const updateMutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: (updatedData) => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.list.baseKey(),
      })
      if (activeInstitute?.id === institute?.id) {
        setActiveInstitute(updatedData)
      }
      onClose()
    },
  })

  const phones = watch("phones") || [""]
  const selectedColor = watch("primaryColor") || "#10b981"

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

  const onSubmit = (values: UpdateInstituteInput) => {
    if (!institute) return
    updateMutation.mutate({
      id: institute.id,
      body: {
        ...values,
        phones: values.phones ? values.phones.filter(Boolean) : [],
      },
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
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

            <div
              className={cn("space-y-4", activeTab !== "general" && "hidden")}
            >
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel>{t("createModal.name")}</FieldLabel>
                <Input {...register("name")} />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.subdomain)}>
                <FieldLabel>{t("createModal.subdomain")}</FieldLabel>
                <div className="relative flex items-center" dir="ltr">
                  <Input
                    {...register("subdomain")}
                    className="pe-28 font-mono"
                  />
                  <span className="pointer-events-none absolute end-3 font-mono text-xs text-muted-foreground">
                    {t("createModal.subdomainSuffix")}
                  </span>
                </div>
                <FieldError>{errors.subdomain?.message}</FieldError>
              </Field>

              {/* Operational Status / Ban toggle */}
              <Field className="rounded-xl border border-border/80 bg-muted/40 p-3.5">
                <div className="flex items-center gap-3">
                  <Controller
                    control={control}
                    name="isActive"
                    render={({ field }) => (
                      <Checkbox
                        id="edit-institute-isActive"
                        checked={Boolean(field.value)}
                        onCheckedChange={(checked) =>
                          field.onChange(Boolean(checked))
                        }
                      />
                    )}
                  />
                  <label
                    htmlFor="edit-institute-isActive"
                    className="cursor-pointer text-xs font-medium text-foreground select-none"
                  >
                    {t("createModal.statusActive")}
                  </label>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("editModal.statusActiveHint")}
                </p>
              </Field>

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
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("createModal.primaryColorCustom")}:
                  </span>
                  <Input
                    {...register("primaryColor")}
                    placeholder="#10b981"
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

            <div
              className={cn("space-y-4", activeTab !== "contact" && "hidden")}
            >
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
                        className="h-10 flex-1 rounded-xl font-mono text-sm"
                        dir="ltr"
                      />
                      {phones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePhone(index)}
                          className="size-9 shrink-0 cursor-pointer rounded-lg p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Field>

              <Field data-invalid={Boolean(errors.address)}>
                <FieldLabel>{t("createModal.address")}</FieldLabel>
                <Input {...register("address")} />
                <FieldError>{errors.address?.message}</FieldError>
              </Field>
            </div>

            <div
              className={cn("space-y-4", activeTab !== "banking" && "hidden")}
            >
              <Field data-invalid={Boolean(errors.bankAccountName)}>
                <FieldLabel>{t("createModal.bankAccountName")}</FieldLabel>
                <Input {...register("bankAccountName")} />
                <FieldError>{errors.bankAccountName?.message}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.bankCardNumber)}>
                <FieldLabel>{t("createModal.bankCardNumber")}</FieldLabel>
                <Input
                  {...register("bankCardNumber")}
                  className="font-mono"
                  dir="ltr"
                />
                <FieldError>{errors.bankCardNumber?.message}</FieldError>
              </Field>
              <Field data-invalid={Boolean(errors.bankShaba)}>
                <FieldLabel>{t("createModal.bankShaba")}</FieldLabel>
                <Input
                  {...register("bankShaba")}
                  className="font-mono"
                  dir="ltr"
                />
                <FieldError>{errors.bankShaba?.message}</FieldError>
              </Field>
            </div>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner className="me-2 size-5 text-primary-foreground" />
                  {t("editModal.submitting")}
                </>
              ) : (
                t("editModal.submit")
              )}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
