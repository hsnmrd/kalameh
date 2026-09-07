"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "@workspace/ui/components/sonner"
import { DEFAULT_ENABLED_MODULES } from "@workspace/types"
import { institutesResource } from "@/lib/api"
import {
  type CreateInstituteInput,
  useCreateInstituteSchema,
} from "../../hooks/use-institute-schemas"
import type { InstituteFormTab } from "../institute-form-types"
import { InstituteStepNavigation } from "../institute-step-navigation"
import { FormFooter } from "./form-footer"
import { GeneralFields } from "./general-fields"
import { SupplementalFields } from "./supplemental-fields"

export interface CreateInstituteModalProps {
  open: boolean
  onClose: () => void
}

const DEFAULT_VALUES: CreateInstituteInput = {
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
}

export function CreateInstituteModal({
  open,
  onClose,
}: CreateInstituteModalProps) {
  const t = useTranslations("institutes")
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = React.useState<InstituteFormTab>("general")
  const form = useForm<CreateInstituteInput>({
    resolver: zodResolver(useCreateInstituteSchema()),
    defaultValues: DEFAULT_VALUES,
  })
  const { handleSubmit, reset, getValues, setValue, trigger } = form

  React.useEffect(() => {
    if (open) {
      reset(DEFAULT_VALUES)
      setActiveTab("general")
    }
  }, [open, reset])
  const mutation = useMutation({
    ...institutesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.list.baseKey(),
      })
      onClose()
    },
  })
  const handleNextStep = async () => {
    if (activeTab === "general") {
      if (await trigger(["name", "subdomain", "primaryColor"]))
        setActiveTab("modules")
    } else if (activeTab === "modules") setActiveTab("contact")
    else if (activeTab === "contact") setActiveTab("banking")
  }
  const handleBack = () =>
    setActiveTab(
      activeTab === "banking"
        ? "contact"
        : activeTab === "contact"
          ? "modules"
          : "general"
    )
  const onSubmit = (values: CreateInstituteInput) => {
    if (activeTab === "banking")
      mutation.mutate({
        ...values,
        phones: values.phones?.filter(Boolean) || [],
      })
  }

  return (
    <FormDialog open={open} onOpenChange={(value) => !value && onClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.target as HTMLElement).tagName !== "TEXTAREA"
            ) {
              event.preventDefault()
              if (activeTab !== "banking") void handleNextStep()
            }
          }}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <InstituteStepNavigation
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <GeneralFields form={form} visible={activeTab === "general"} />
            <SupplementalFields
              form={form}
              activeTab={activeTab}
              onAddPhone={() =>
                setValue("phones", [...(getValues("phones") || []), ""])
              }
              onRemovePhone={(index) =>
                setValue(
                  "phones",
                  (getValues("phones") || []).filter(
                    (_, itemIndex) => itemIndex !== index
                  )
                )
              }
            />
          </div>
          <FormFooter
            activeTab={activeTab}
            isPending={mutation.isPending}
            onBack={handleBack}
            onClose={onClose}
            onNext={() => void handleNextStep()}
          />
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
