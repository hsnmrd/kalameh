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
import type {
  TeacherDto,
  TeacherAvailabilityInput,
  OccupiedSlotInfo,
  WeekDay,
} from "@workspace/types"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { branchesResource, teachersResource, termsResource } from "@/lib/api"
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

  const { data: branches = [] } = useQuery({
    ...branchesResource.list.toQuery(
      resolvedInstituteId ? { instituteId: resolvedInstituteId } : undefined
    ),
    enabled: open && Boolean(resolvedInstituteId),
  })

  const activeBranches = React.useMemo(() => {
    return branches.filter((b) => b.isActive)
  }, [branches])

  const [selectedBranchId, setSelectedBranchId] = React.useState<string | null>(
    null
  )
  const currentBranchId =
    selectedBranchId || teacher?.branchId || activeBranches[0]?.id || null

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

  const { data: allTermAvailabilities, isLoading: isLoadingAvailabilities } =
    useQuery({
      ...teachersResource.getAvailabilities.toQuery({
        id: teacher?.id || "",
        termId: currentTermId || undefined,
      }),
      enabled: open && Boolean(teacher?.id),
    })

  const currentTeacher = detailedTeacher || teacher

  const draftKey = `${currentTermId || "all"}:${currentBranchId || "all"}`
  const [draftSlotsByScope, setDraftSlotsByScope] = React.useState<
    Record<string, TeacherAvailabilityInput[]>
  >({})

  const serverSlots = React.useMemo<TeacherAvailabilityInput[]>(() => {
    if (allTermAvailabilities) {
      return allTermAvailabilities
        .filter((slot) => !currentBranchId || slot.branchId === currentBranchId)
        .map((slot) => ({
          id: slot.id,
          termId: slot.termId,
          branchId: slot.branchId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }))
    }
    const all = currentTeacher?.teacherProfile?.availabilities || []
    const forTerm = currentTermId
      ? all.filter((s) => s.termId === currentTermId)
      : []
    const forBranch = currentBranchId
      ? forTerm.filter((s) => s.branchId === currentBranchId)
      : forTerm
    const effective =
      forBranch.length > 0
        ? forBranch
        : all.filter(
            (s) =>
              !s.termId && (!currentBranchId || s.branchId === currentBranchId)
          )
    return effective.map((slot) => ({
      id: slot.id,
      termId: slot.termId,
      branchId: slot.branchId,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }))
  }, [allTermAvailabilities, currentTeacher, currentTermId, currentBranchId])

  const activeSlots = draftSlotsByScope[draftKey] ?? serverSlots

  const occupiedSlots = React.useMemo<OccupiedSlotInfo[]>(() => {
    if (!currentBranchId) return []
    const otherBranches = activeBranches.filter((b) => b.id !== currentBranchId)
    const result: OccupiedSlotInfo[] = []

    for (const otherBranch of otherBranches) {
      const scopeKey = `${currentTermId || "all"}:${otherBranch.id}`
      const slots =
        draftSlotsByScope[scopeKey] ??
        (allTermAvailabilities || []).filter(
          (s) => s.branchId === otherBranch.id
        )

      for (const slot of slots) {
        result.push({
          dayOfWeek: slot.dayOfWeek as WeekDay,
          startTime: slot.startTime,
          endTime: slot.endTime,
          branchId: otherBranch.id,
          branchName: otherBranch.name,
        })
      }
    }

    return result
  }, [
    activeBranches,
    currentBranchId,
    currentTermId,
    draftSlotsByScope,
    allTermAvailabilities,
  ])

  const handleSlotsChange = React.useCallback(
    (slots: TeacherAvailabilityInput[]) => {
      setDraftSlotsByScope((prev) => ({
        ...prev,
        [draftKey]: slots,
      }))
    },
    [draftKey]
  )

  const handleClose = React.useCallback(() => {
    setDraftSlotsByScope({})
    setSelectedTermId(null)
    setSelectedBranchId(null)
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

    const touchedBranchIds = activeBranches
      .map((b) => b.id)
      .filter((branchId) => {
        const key = `${currentTermId || "all"}:${branchId}`
        return draftSlotsByScope[key] !== undefined
      })

    if (touchedBranchIds.length <= 1) {
      updateMutation.mutate({
        id: teacher.id,
        termId: currentTermId || undefined,
        branchId: currentBranchId || undefined,
        availabilities: activeSlots.map((slot) => ({
          ...slot,
          branchId: slot.branchId || currentBranchId || undefined,
        })),
      })
      return
    }

    const allSlots: TeacherAvailabilityInput[] = []
    for (const branch of activeBranches) {
      const key = `${currentTermId || "all"}:${branch.id}`
      const slots =
        draftSlotsByScope[key] ??
        (allTermAvailabilities || []).filter((s) => s.branchId === branch.id)
      for (const s of slots) {
        allSlots.push({
          ...s,
          branchId: branch.id,
          termId: currentTermId || undefined,
        })
      }
    }

    updateMutation.mutate({
      id: teacher.id,
      termId: currentTermId || undefined,
      availabilities: allSlots,
    })
  }

  const isLoadingData =
    (isLoadingTeacher && !detailedTeacher) ||
    (isLoadingAvailabilities && !allTermAvailabilities)

  return (
    <FormDialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("availabilities.modalTitle")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {activeBranches.length > 0 && (
            <div className="flex flex-col gap-1.5 sm:max-w-xs">
              <span className="text-xs font-medium text-foreground">
                {t("availabilities.branch")}
              </span>
              <ResponsiveCombobox
                items={activeBranches.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
                value={currentBranchId || ""}
                onValueChange={(val) => setSelectedBranchId(val || null)}
                placeholder={t("availabilities.selectBranch")}
                clearable={false}
              />
            </div>
          )}

          {isLoadingData ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-8 text-foreground" />
            </div>
          ) : (
            <AvailabilityEditor
              value={activeSlots}
              onChange={handleSlotsChange}
              occupiedSlots={occupiedSlots}
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
