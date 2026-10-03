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
import { teachersResource } from "@/lib/api"
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

  const { data: detailedTeacher, isLoading: isLoadingTeacher } = useQuery({
    ...teachersResource.detail.toQuery(teacher?.id || ""),
    enabled: open && Boolean(teacher?.id),
  })

  const currentTeacher = detailedTeacher || teacher
  const [draftSlots, setDraftSlots] = React.useState<
    TeacherAvailabilityInput[] | null
  >(null)

  const serverSlots = React.useMemo<TeacherAvailabilityInput[]>(() => {
    return (
      currentTeacher?.teacherProfile?.availabilities?.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })) || []
    )
  }, [currentTeacher])

  const activeSlots = draftSlots ?? serverSlots

  const handleClose = React.useCallback(() => {
    setDraftSlots(null)
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
      }
      handleClose()
    },
    onError: () => {
      toast.error(t("availabilities.updateError"))
    },
  })

  if (!teacher) return null

  const resolvedInstituteId = teacher.instituteId || instituteId

  const handleSave = () => {
    if (!teacher.id) return
    updateMutation.mutate({
      id: teacher.id,
      availabilities: activeSlots,
    })
  }

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("availabilities.modalTitle")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {isLoadingTeacher && !detailedTeacher ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : (
            <AvailabilityEditor
              value={activeSlots}
              onChange={setDraftSlots}
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
            disabled={
              updateMutation.isPending || (isLoadingTeacher && !detailedTeacher)
            }
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
