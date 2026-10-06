"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import type { TeacherDto, TeacherAvailabilityInput } from "@workspace/types"
import { teachersResource, termsResource } from "@/lib/api"
import { AvailabilityEditor } from "../availability-editor"

export interface TeacherAvailabilityModalProps {
  teacher: TeacherDto | null
  open: boolean
  onClose: () => void
  instituteId?: string
}

export function TeacherAvailabilityModal({
  teacher,
  open,
  onClose,
  instituteId,
}: TeacherAvailabilityModalProps) {
  const t = useTranslations("teachers")
  const queryClient = useQueryClient()
  const resolvedInstituteId = teacher?.instituteId || instituteId

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery(
      resolvedInstituteId ? { instituteId: resolvedInstituteId } : undefined
    ),
    enabled: open && Boolean(resolvedInstituteId),
  })

  const activeTerms = React.useMemo(() => {
    const withPhase = terms.filter((term) => Boolean(term.operatingPhase))
    const active = withPhase.filter((term) => term.isActive)
    return active.length > 0 ? active : withPhase
  }, [terms])

  const [selectedTermId, setSelectedTermId] = React.useState<string | null>(
    null
  )
  const currentTermId = selectedTermId || activeTerms[0]?.id || null

  const { data: detailedTeacher, isLoading: isLoadingTeacher } = useQuery({
    ...teachersResource.detail.toQuery(teacher?.id || ""),
    enabled: open && Boolean(teacher?.id),
  })

  const { data: termAvailabilities, isLoading: isLoadingAvailabilities } =
    useQuery({
      ...teachersResource.getAvailabilities.toQuery({
        id: teacher?.id || "",
        termId: currentTermId || undefined,
      }),
      enabled: open && Boolean(teacher?.id),
    })

  const currentTeacher = detailedTeacher || teacher

  const [draftSlotsByTerm, setDraftSlotsByTerm] = React.useState<
    Record<string, TeacherAvailabilityInput[]>
  >({})

  const serverSlots = React.useMemo<TeacherAvailabilityInput[]>(() => {
    if (termAvailabilities) {
      return termAvailabilities.map((slot) => ({
        id: slot.id,
        termId: slot.termId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      }))
    }
    const all = currentTeacher?.teacherProfile?.availabilities || []
    const forTerm = currentTermId
      ? all.filter((s) => s.termId === currentTermId)
      : []
    const effective =
      forTerm.length > 0 ? forTerm : all.filter((s) => !s.termId)
    return effective.map((slot) => ({
      id: slot.id,
      termId: slot.termId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }))
  }, [termAvailabilities, currentTeacher, currentTermId])

  const activeSlots =
    currentTermId && draftSlotsByTerm[currentTermId]
      ? draftSlotsByTerm[currentTermId]!
      : serverSlots

  const handleSlotsChange = React.useCallback(
    (slots: TeacherAvailabilityInput[]) => {
      if (!currentTermId) return
      setDraftSlotsByTerm((prev) => ({
        ...prev,
        [currentTermId]: slots,
      }))
    },
    [currentTermId]
  )

  const handleClose = React.useCallback(() => {
    setDraftSlotsByTerm({})
    setSelectedTermId(null)
    onClose()
  }, [onClose])

  const updateMutation = useMutation({
    ...teachersResource.updateAvailabilities.toMutation(),
    onSuccess: () => {
      toast.success(t("availabilities.updateSuccess"))
      queryClient.invalidateQueries({
        queryKey: teachersResource.list.baseKey(),
      })
      if (teacher?.id) {
        queryClient.invalidateQueries({
          queryKey: teachersResource.detail.key(teacher.id),
        })
        queryClient.invalidateQueries({
          queryKey: teachersResource.getAvailabilities.baseKey(),
        })
      }
      handleClose()
    },
    onError: () => {
      toast.error(t("availabilities.updateError"))
    },
  })

  if (!teacher) return null

  const handleSave = () => {
    if (!teacher.id) return
    updateMutation.mutate({
      id: teacher.id,
      termId: currentTermId || undefined,
      availabilities: activeSlots,
    })
  }

  const isLoadingData =
    (isLoadingTeacher && !detailedTeacher) ||
    (isLoadingAvailabilities && !termAvailabilities)

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("availabilities.modalTitle")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {isLoadingData ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : (
            <AvailabilityEditor
              value={activeSlots}
              onChange={handleSlotsChange}
              selectedTermId={currentTermId}
              onSelectTermId={setSelectedTermId}
              instituteId={resolvedInstituteId}
            />
          )}
        </div>

        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateMutation.isPending}
          >
            {t("createModal.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoadingData}
          >
            {updateMutation.isPending && (
              <Spinner className="me-2 size-4 text-primary-foreground" />
            )}
            {t("availabilities.save")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
