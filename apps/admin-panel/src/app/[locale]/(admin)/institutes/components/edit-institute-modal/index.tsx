"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
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
import {
  DEFAULT_ENABLED_MODULES,
  type InstituteWithStats,
} from "@workspace/types"
import { institutesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  type UpdateInstituteInput,
  useUpdateInstituteSchema,
} from "../../hooks/use-institute-schemas"
import type { InstituteFormTab } from "../institute-form-types"
import { InstituteStepNavigation } from "../institute-step-navigation"
import { GeneralFields } from "./general-fields"
import { SupplementalFields } from "./supplemental-fields"

export interface EditInstituteModalProps {
  open: boolean
  onClose: () => void
  institute: InstituteWithStats | null
}

const EMPTY_VALUES: UpdateInstituteInput = {
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

export function EditInstituteModal({
  open,
  onClose,
  institute,
}: EditInstituteModalProps) {
  const t = useTranslations("institutes")
  const queryClient = useQueryClient()
  const { activeInstitute, setActiveInstitute } = useActiveInstitute()
  const [activeTab, setActiveTab] = React.useState<InstituteFormTab>("general")
  const formValues = React.useMemo<UpdateInstituteInput>(
    () =>
      institute
        ? {
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
            phones: institute.phones?.length ? institute.phones : [""],
            bankAccountName: institute.bankAccountName || "",
            bankCardNumber: institute.bankCardNumber || "",
            bankShaba: institute.bankShaba || "",
          }
        : EMPTY_VALUES,
    [institute]
  )
  const form = useForm<UpdateInstituteInput>({
    resolver: zodResolver(useUpdateInstituteSchema()),
    defaultValues: EMPTY_VALUES,
    values: formValues,
  })
  const { handleSubmit, reset, getValues, setValue } = form

  const handleClose = React.useCallback(() => {
    reset(formValues)
    setActiveTab("general")
    onClose()
  }, [formValues, onClose, reset])

  const mutation = useMutation({
    ...institutesResource.update.toMutation(),
    onSuccess: (updated) => {
      toast.success(t("editModal.success"))
      queryClient.invalidateQueries({
        queryKey: institutesResource.list.baseKey(),
      })
      if (activeInstitute?.id === institute?.id) setActiveInstitute(updated)
      handleClose()
    },
  })
  const onSubmit = (values: UpdateInstituteInput) => {
    if (institute)
      mutation.mutate({
        id: institute.id,
        body: { ...values, phones: values.phones?.filter(Boolean) || [] },
      })
  }

  return (
    <FormDialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("editModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
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
          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {mutation.isPending ? (
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
