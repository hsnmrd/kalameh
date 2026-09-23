"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import type {
  ClassRequirementDto,
  UpdateClassRequirementInput,
} from "@workspace/types"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"

export interface EditRequirementModalProps {
  item: ClassRequirementDto | null
  open: boolean
  onClose: () => void
  onSave: (id: string, data: UpdateClassRequirementInput) => void
  isSaving?: boolean
}

export function EditRequirementModal({
  item,
  open,
  onClose,
  onSave,
  isSaving,
}: EditRequirementModalProps) {
  const t = useTranslations("scheduling")

  const [requiredClassCount, setRequiredClassCount] = React.useState(1)
  const [capacity, setCapacity] = React.useState(14)
  const [deliveryMode, setDeliveryMode] = React.useState<
    "IN_PERSON" | "ONLINE"
  >("IN_PERSON")
  const [sessionsPerWeek, setSessionsPerWeek] = React.useState<number>(3)

  React.useEffect(() => {
    if (item) {
      setRequiredClassCount(item.requiredClassCount)
      setCapacity(item.capacity)
      setDeliveryMode(item.deliveryMode)
      setSessionsPerWeek(item.sessionsPerWeek ?? 3)
    }
  }, [item])

  if (!item) return null

  const cadenceOptions = [
    { value: "3", label: t("requirementsPage.fields.cadence3") },
    { value: "2", label: t("requirementsPage.fields.cadence2") },
    { value: "1", label: t("requirementsPage.fields.cadence1") },
  ]

  const deliveryModeOptions = [
    { value: "IN_PERSON", label: t("demand.deliveryModes.IN_PERSON") },
    { value: "ONLINE", label: t("demand.deliveryModes.ONLINE") },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(item.id, {
      requiredClassCount: Math.max(1, requiredClassCount),
      capacity: Math.max(1, capacity),
      deliveryMode,
      sessionsPerWeek,
      sessionDurationMinutes: 90,
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <ResponsiveDialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <ResponsiveDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <ResponsiveDialogTitle>
            {t("requirementsPage.editRequirement")}
            {item.course?.title ? ` — ${item.course.title}` : ""}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("requirementsPage.description")}
          </ResponsiveDialogDescription>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>
                  {t("requirementsPage.fields.requiredClassCount")}
                </FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={requiredClassCount}
                  onChange={(e) =>
                    setRequiredClassCount(Number(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel>{t("requirementsPage.fields.capacity")}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>
                {t("requirementsPage.fields.sessionsPerWeek")}
              </FieldLabel>
              <ResponsiveCombobox
                items={cadenceOptions}
                value={String(sessionsPerWeek)}
                onValueChange={(val) => val && setSessionsPerWeek(Number(val))}
                placeholder={t("requirementsPage.fields.sessionsPerWeek")}
                drawerTitle={t("requirementsPage.fields.sessionsPerWeek")}
                clearable={false}
              />
            </Field>

            <Field>
              <FieldLabel>
                {t("requirementsPage.fields.deliveryMode")}
              </FieldLabel>
              <ResponsiveCombobox
                items={deliveryModeOptions}
                value={deliveryMode}
                onValueChange={(val) =>
                  val && setDeliveryMode(val as "IN_PERSON" | "ONLINE")
                }
                placeholder={t("requirementsPage.fields.deliveryMode")}
                drawerTitle={t("requirementsPage.fields.deliveryMode")}
                clearable={false}
              />
            </Field>
          </div>

          <ResponsiveDialogFooter className="flex-row items-center gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 sm:justify-end sm:px-6 sm:py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              {t("requirementsPage.actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && (
                <Spinner className="size-4 text-primary-foreground" />
              )}
              <span>{t("requirementsPage.actions.save")}</span>
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
