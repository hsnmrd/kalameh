"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Clock, Info } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import type { OperatingPhase } from "@workspace/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { studentsResource } from "@/lib/api"

export interface SetAllAvailableDialogProps {
  open: boolean
  onClose: () => void
  operatingPhases: OperatingPhase[]
  instituteId?: string
}

export function SetAllAvailableDialog({
  open,
  onClose,
  operatingPhases,
  instituteId,
}: SetAllAvailableDialogProps) {
  const t = useTranslations("students")
  const queryClient = useQueryClient()

  const defaultPhaseId = React.useMemo(() => {
    const active = operatingPhases.find((p) => p.isActive)
    return active ? active.id : (operatingPhases[0]?.id ?? "")
  }, [operatingPhases])

  const [selectedPhaseId, setSelectedPhaseId] = React.useState(defaultPhaseId)

  // Keep selectedPhaseId in sync if phases change
  React.useEffect(() => {
    if (
      defaultPhaseId &&
      (!selectedPhaseId ||
        !operatingPhases.some((p) => p.id === selectedPhaseId))
    ) {
      setSelectedPhaseId(defaultPhaseId)
    }
  }, [defaultPhaseId, operatingPhases, selectedPhaseId])

  const currentPhase = React.useMemo(
    () => operatingPhases.find((p) => p.id === selectedPhaseId),
    [operatingPhases, selectedPhaseId]
  )

  const phaseOptions: ComboboxOption[] = React.useMemo(() => {
    return operatingPhases.map((phase) => ({
      value: phase.id,
      label: phase.title,
    }))
  }, [operatingPhases])

  const setAllMutation = useMutation({
    ...studentsResource.setAllAvailable.toMutation(),
    onSuccess: (res) => {
      toast.success(
        t("setAllAvailableDialog.success", { count: res.studentCount })
      )
      queryClient.invalidateQueries({
        queryKey: studentsResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: studentsResource.getAvailabilities.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: studentsResource.detail.baseKey(),
      })
      onClose()
    },
    onError: () => {
      toast.error(t("setAllAvailableDialog.error"))
    },
  })

  const handleConfirm = () => {
    if (!selectedPhaseId) return
    setAllMutation.mutate({
      operatingPhaseId: selectedPhaseId,
      instituteId,
    })
  }

  const isPending = setAllMutation.isPending

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !next && !isPending && onClose()}
    >
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("setAllAvailableDialog.title")}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-primary/10 text-primary">
            <Clock />
          </AlertDialogMedia>
          <AlertDialogDescription>
            {t("setAllAvailableDialog.description", {
              phaseTitle: currentPhase?.title ?? "",
            })}
          </AlertDialogDescription>
        </div>

        {/* Phase selector if multiple phases exist */}
        {operatingPhases.length > 1 ? (
          <Field className="mt-4">
            <FieldLabel>
              {t("setAllAvailableDialog.selectPhaseLabel")}
            </FieldLabel>
            <ResponsiveCombobox
              items={phaseOptions}
              value={selectedPhaseId}
              onValueChange={(val) => setSelectedPhaseId(val || "")}
              placeholder={t("setAllAvailableDialog.selectPhaseLabel")}
              drawerTitle={t("setAllAvailableDialog.selectPhaseLabel")}
              clearable={false}
              disabled={isPending}
            />
          </Field>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">
                {t("setAllAvailableDialog.selectPhaseLabel")}
              </span>
              <strong className="text-foreground">{currentPhase?.title}</strong>
            </div>
          </div>
        )}

        {/* Informative Note */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border/80 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>{t("setAllAvailableDialog.warningNote")}</span>
        </div>

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel disabled={isPending} onClick={onClose}>
            {t("setAllAvailableDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !selectedPhaseId}
            onClick={handleConfirm}
          >
            {isPending && <Spinner data-icon="inline-start" />}
            {isPending
              ? t("setAllAvailableDialog.applying")
              : t("setAllAvailableDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
