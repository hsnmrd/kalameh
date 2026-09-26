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

interface RequirementDraft {
  sourceKey: string
  requiredClassCount: number
  capacity: number
  deliveryMode: "IN_PERSON" | "ONLINE"
  sessionsPerWeek: number
}

export function EditRequirementModal({
  item,
  open,
  onClose,
  onSave,
  isSaving,
}: EditRequirementModalProps) {
  const t = useTranslations("scheduling")

  const sourceKey = item
    ? [
        item.id,
        item.requiredClassCount,
        item.capacity,
        item.deliveryMode,
        item.sessionsPerWeek ?? 3,
      ].join(":")
    : ""
  const [storedDraft, setStoredDraft] = React.useState<RequirementDraft | null>(
    null
  )

  if (!item) return null

  const draft =
    storedDraft?.sourceKey === sourceKey
      ? storedDraft
      : {
          sourceKey,
          requiredClassCount: item.requiredClassCount,
          capacity: item.capacity,
          deliveryMode: item.deliveryMode,
          sessionsPerWeek: item.sessionsPerWeek ?? 3,
        }
  const updateDraft = (changes: Partial<Omit<RequirementDraft, "sourceKey">>) =>
    setStoredDraft({ ...draft, ...changes })

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
      requiredClassCount: Math.max(1, draft.requiredClassCount),
      capacity: Math.max(1, draft.capacity),
      deliveryMode: draft.deliveryMode,
      sessionsPerWeek: draft.sessionsPerWeek,
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
                  value={draft.requiredClassCount}
                  onChange={(e) =>
                    updateDraft({ requiredClassCount: Number(e.target.value) })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>{t("requirementsPage.fields.capacity")}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={draft.capacity}
                  onChange={(e) =>
                    updateDraft({ capacity: Number(e.target.value) })
                  }
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>
                {t("requirementsPage.fields.sessionsPerWeek")}
              </FieldLabel>
              <ResponsiveCombobox
                items={cadenceOptions}
                value={String(draft.sessionsPerWeek)}
                onValueChange={(val) =>
                  val && updateDraft({ sessionsPerWeek: Number(val) })
                }
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
                value={draft.deliveryMode}
                onValueChange={(val) =>
                  val &&
                  updateDraft({
                    deliveryMode: val as "IN_PERSON" | "ONLINE",
                  })
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
