"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import type { ClassRequirementInput } from "@workspace/types"
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
import { coursesResource, branchesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface CreateRequirementModalProps {
  termId: string
  open: boolean
  onClose: () => void
  onSave: (data: ClassRequirementInput) => void
  isSaving?: boolean
}

export function CreateRequirementModal({
  termId,
  open,
  onClose,
  onSave,
  isSaving,
}: CreateRequirementModalProps) {
  const t = useTranslations("scheduling")
  const { activeInstituteId } = useActiveInstitute()

  const [courseId, setCourseId] = React.useState("")
  const [branchId, setBranchId] = React.useState("")
  const [requiredClassCount, setRequiredClassCount] = React.useState(1)
  const [capacity, setCapacity] = React.useState(14)
  const [deliveryMode, setDeliveryMode] = React.useState<
    "IN_PERSON" | "ONLINE"
  >("IN_PERSON")
  const [sessionsPerWeek, setSessionsPerWeek] = React.useState<number>(3)

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: courses = [] } = useQuery({
    ...coursesResource.list.toQuery(queryParams),
    enabled: Boolean(activeInstituteId && open),
  })

  const { data: branches = [] } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: Boolean(activeInstituteId && open),
  })

  const courseOptions = React.useMemo(
    () =>
      courses.map((c) => ({
        value: c.id,
        label: c.title,
      })),
    [courses]
  )

  const branchOptions = React.useMemo(
    () => [
      { value: "all", label: t("requirementsPage.fields.branchPlaceholder") },
      ...branches.map((b) => ({
        value: b.id,
        label: b.name,
      })),
    ],
    [branches, t]
  )

  const cadenceOptions = [
    { value: "3", label: t("requirementsPage.fields.cadence3") },
    { value: "2", label: t("requirementsPage.fields.cadence2") },
    { value: "1", label: t("requirementsPage.fields.cadence1") },
  ]

  const deliveryModeOptions = [
    { value: "IN_PERSON", label: t("demand.deliveryModes.IN_PERSON") },
    { value: "ONLINE", label: t("demand.deliveryModes.ONLINE") },
  ]

  const handleReset = () => {
    setCourseId("")
    setBranchId("")
    setRequiredClassCount(1)
    setCapacity(14)
    setDeliveryMode("IN_PERSON")
    setSessionsPerWeek(3)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return

    onSave({
      termId,
      courseId,
      branchId: branchId && branchId !== "all" ? branchId : null,
      requiredClassCount: Math.max(1, requiredClassCount),
      capacity: Math.max(1, capacity),
      deliveryMode,
      sessionsPerWeek,
      sessionDurationMinutes: 90,
      instituteId: activeInstituteId || undefined,
      isActive: true,
    })
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <ResponsiveDialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <ResponsiveDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <ResponsiveDialogTitle>
            {t("requirementsPage.addRequirement")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("requirementsPage.description")}
          </ResponsiveDialogDescription>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <Field>
              <FieldLabel>{t("requirementsPage.fields.course")}</FieldLabel>
              <ResponsiveCombobox
                items={courseOptions}
                value={courseId}
                onValueChange={(val) => setCourseId(val ?? "")}
                placeholder={t("requirementsPage.fields.coursePlaceholder")}
                drawerTitle={t("requirementsPage.fields.course")}
                clearable={false}
              />
            </Field>

            <Field>
              <FieldLabel>{t("requirementsPage.fields.branch")}</FieldLabel>
              <ResponsiveCombobox
                items={branchOptions}
                value={branchId || "all"}
                onValueChange={(val) =>
                  setBranchId(val === "all" || !val ? "" : val)
                }
                placeholder={t("requirementsPage.fields.branchPlaceholder")}
                drawerTitle={t("requirementsPage.fields.branch")}
                clearable={false}
              />
            </Field>

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
              onClick={handleClose}
              disabled={isSaving}
            >
              {t("requirementsPage.actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving || !courseId}>
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
