"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Clock, Info } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { findCurrentActiveTerm, type TermDto } from "@workspace/types"
import {
  ResponsiveDialog,
  ResponsiveDialogCloseButton,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
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
    // 1. Current active term has top priority as default
    const activeTerm = findCurrentActiveTerm(terms)
    if (activeTerm?.id && terms.some((term) => term.id === activeTerm.id)) {
      if (
        defaultTermId &&
        defaultTermId !== activeTerm.id &&
        terms.some((term) => term.id === defaultTermId)
      ) {
        return defaultTermId
      }
      return activeTerm.id
    }

    // 2. If explicit defaultTermId passed and exists in terms, use it
    if (defaultTermId && terms.some((term) => term.id === defaultTermId)) {
      return defaultTermId
    }

    // 3. Look for unconfirmed term
    const unconfirmed = terms.find((term) => !term.studentSchedulesConfirmedAt)
    if (unconfirmed?.id) {
      return unconfirmed.id
    }

    // 4. Fallback to first available term
    return terms[0]?.id ?? ""
  }, [defaultTermId, terms])

  const [selectedTermId, setSelectedTermId] = React.useState(
    resolvedInitialTermId
  )

  React.useEffect(() => {
    if (open && resolvedInitialTermId) {
      setSelectedTermId(resolvedInitialTermId)
    }
  }, [open, resolvedInitialTermId])

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
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => !next && !isPending && onClose()}
    >
      <ResponsiveDialogContent className="overflow-hidden p-0 sm:max-w-md">
        <ResponsiveDialogHeader className="border-b border-border/60 px-4 py-3.5 sm:px-6 sm:py-4">
          <ResponsiveDialogTitle>{t("dialogTitle")}</ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-foreground/90">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="size-4" />
            </div>
            <p>
              {t("dialogDescription", {
                termTitle: currentTerm?.title ?? "",
              })}
            </p>
          </div>

          {terms.length > 1 ? (
            <Field className="space-y-1.5">
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
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{t("selectTerm")}</span>
                <strong className="text-foreground">{currentTerm.title}</strong>
              </div>
            </div>
          ) : null}

          {isAlreadyConfirmed && currentTerm?.studentSchedulesConfirmedAt && (
            <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
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
        </div>

        <ResponsiveDialogFooter className="flex-row items-center gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:justify-end sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="min-w-0 flex-1 sm:flex-initial"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={isPending || !selectedTermId}
            onClick={handleConfirm}
            className="min-w-0 flex-1 sm:flex-initial"
          >
            {isPending && <Spinner data-icon="inline-start" />}
            <span>{t("confirm")}</span>
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
