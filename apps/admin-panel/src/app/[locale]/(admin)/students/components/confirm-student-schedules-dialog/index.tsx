"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Clock, Info } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { TermDto } from "@workspace/types"
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
import {
  ResponsiveCombobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { toast } from "@workspace/ui/components/sonner"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatDate } from "@workspace/ui/lib/utils"
import { schedulingResource, termsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

export interface ConfirmStudentSchedulesDialogProps {
  open: boolean
  onClose: () => void
  terms?: TermDto[]
  defaultTermId?: string
  instituteId?: string
}

export function ConfirmStudentSchedulesDialog({
  open,
  onClose,
  terms: passedTerms,
  defaultTermId,
  instituteId: propInstituteId,
}: ConfirmStudentSchedulesDialogProps) {
  const t = useTranslations("students.confirmStudentSchedules")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const instituteId = propInstituteId ?? activeInstituteId

  const { data: fetchedTerms = [] } = useQuery({
    ...termsResource.list.toQuery(instituteId ? { instituteId } : undefined),
    enabled: (!passedTerms || passedTerms.length === 0) && Boolean(instituteId),
  })

  const terms =
    passedTerms && passedTerms.length > 0 ? passedTerms : fetchedTerms

  const resolvedInitialTermId = React.useMemo(() => {
    if (defaultTermId && terms.some((term) => term.id === defaultTermId)) {
      return defaultTermId
    }
    const unconfirmed = terms.find((term) => !term.studentSchedulesConfirmedAt)
    return unconfirmed?.id ?? terms[0]?.id ?? ""
  }, [defaultTermId, terms])

  const [selectedTermId, setSelectedTermId] = React.useState(
    resolvedInitialTermId
  )

  React.useEffect(() => {
    if (
      resolvedInitialTermId &&
      (!selectedTermId || !terms.some((term) => term.id === selectedTermId))
    ) {
      setSelectedTermId(resolvedInitialTermId)
    }
  }, [resolvedInitialTermId, selectedTermId, terms])

  const currentTerm = React.useMemo(
    () => terms.find((term) => term.id === selectedTermId),
    [selectedTermId, terms]
  )

  const termOptions: ComboboxOption[] = React.useMemo(
    () =>
      terms.map((term) => ({
        value: term.id,
        label: term.title,
      })),
    [terms]
  )

  const confirmMutation = useMutation({
    ...termsResource.confirmStudentSchedules.toMutation(),
    onSuccess: () => {
      toast.success(
        t("success", {
          termTitle: currentTerm?.title ?? "",
        })
      )
      void queryClient.invalidateQueries({
        queryKey: termsResource.list.baseKey(),
      })
      void queryClient.invalidateQueries({
        queryKey: schedulingResource.terms.baseKey(),
      })
      onClose()
    },
  })

  const isPending = confirmMutation.isPending
  const isAlreadyConfirmed = Boolean(currentTerm?.studentSchedulesConfirmedAt)

  const handleConfirm = () => {
    if (!selectedTermId) return
    confirmMutation.mutate(selectedTermId)
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !next && !isPending && onClose()}
    >
      <AlertDialogContent className="p-6 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialogTitle")}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-4 flex items-start gap-4">
          <AlertDialogMedia className="mb-0 bg-primary/10 text-primary">
            <Clock />
          </AlertDialogMedia>
          <AlertDialogDescription>
            {t("dialogDescription", {
              termTitle: currentTerm?.title ?? "",
            })}
          </AlertDialogDescription>
        </div>

        {terms.length > 1 ? (
          <Field className="mt-4">
            <FieldLabel>{t("selectTerm")}</FieldLabel>
            <ResponsiveCombobox
              items={termOptions}
              value={selectedTermId}
              onValueChange={(val) => setSelectedTermId(val || "")}
              placeholder={t("selectTerm")}
              drawerTitle={t("selectTerm")}
              clearable={false}
              disabled={isPending}
            />
          </Field>
        ) : currentTerm ? (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t("selectTerm")}</span>
              <strong className="text-foreground">{currentTerm.title}</strong>
            </div>
          </div>
        ) : null}

        {isAlreadyConfirmed && currentTerm?.studentSchedulesConfirmedAt && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border/80 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span>
              {t("alreadyConfirmed", {
                date: formatDate(
                  currentTerm.studentSchedulesConfirmedAt,
                  locale
                ),
              })}
            </span>
          </div>
        )}

        <AlertDialogFooter className="mt-6 flex-row items-center gap-3 sm:border-t sm:border-border/60 sm:pt-4">
          <AlertDialogCancel disabled={isPending} onClick={onClose}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || !selectedTermId}
            onClick={handleConfirm}
          >
            {isPending && <Spinner data-icon="inline-start" />}
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
