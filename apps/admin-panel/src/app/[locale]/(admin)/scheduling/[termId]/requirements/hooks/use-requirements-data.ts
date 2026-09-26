"use client"

import { useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import type {
  ClassRequirementInput,
  UpdateClassRequirementInput,
} from "@workspace/types"
import {
  classRequirementsResource,
  classesResource,
  schedulingResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

interface UseRequirementsDataOptions {
  termId: string
  branchId: string
  onCreated: () => void
  onUpdated: () => void
  onDeleted: () => void
  onSynced: () => void
}

export function useRequirementsData({
  termId,
  branchId,
  onCreated,
  onUpdated,
  onDeleted,
  onSynced,
}: UseRequirementsDataOptions) {
  const t = useTranslations("scheduling")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const normalizedBranchId =
    branchId && branchId !== "all" ? branchId : undefined
  const invalidateRequirements = () => {
    queryClient.invalidateQueries({
      queryKey: classRequirementsResource.list.baseKey(),
    })
    queryClient.invalidateQueries({
      queryKey: schedulingResource.terms.baseKey(),
    })
  }

  const termsQuery = useQuery({
    ...schedulingResource.terms.toQuery(
      activeInstituteId ? { instituteId: activeInstituteId } : undefined
    ),
    enabled: Boolean(activeInstituteId),
  })
  const requirementsQuery = useQuery({
    ...classRequirementsResource.list.toQuery({
      termId,
      branchId: normalizedBranchId,
      instituteId: activeInstituteId || undefined,
    }),
    enabled: Boolean(termId && activeInstituteId),
  })
  const createMutation = useMutation({
    ...classRequirementsResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("requirementsPage.createSuccess"))
      onCreated()
      invalidateRequirements()
    },
  })
  const updateMutation = useMutation({
    ...classRequirementsResource.update.toMutation(),
    onSuccess: () => {
      toast.success(t("requirementsPage.updateSuccess"))
      onUpdated()
      invalidateRequirements()
    },
  })
  const deleteMutation = useMutation({
    ...classRequirementsResource.deactivate.toMutation(),
    onSuccess: () => {
      toast.success(t("requirementsPage.deleteSuccess"))
      onDeleted()
      invalidateRequirements()
    },
  })
  const calculateMutation = useMutation({
    ...schedulingResource.calculateDemand.toMutation(),
  })
  const applyMutation = useMutation({
    ...schedulingResource.applyDemand.toMutation(),
    onSuccess: (result) => {
      toast.success(
        t("requirementsPage.syncDemandSuccess", {
          count: result.totalRequirements,
        })
      )
      onSynced()
      invalidateRequirements()
      queryClient.invalidateQueries({
        queryKey: classesResource.list.baseKey(),
      })
    },
  })

  const create = (data: ClassRequirementInput) =>
    createMutation.mutate({
      body: data,
      instituteId: activeInstituteId || undefined,
    })
  const update = (id: string, data: UpdateClassRequirementInput) =>
    updateMutation.mutate({
      id,
      body: data,
      instituteId: activeInstituteId || undefined,
    })
  const remove = (id: string) =>
    deleteMutation.mutate({ id, instituteId: activeInstituteId || undefined })
  const sync = () => {
    if (!termId) return
    calculateMutation.mutate(
      {
        termId,
        branchId: normalizedBranchId,
        instituteId: activeInstituteId || undefined,
        defaultCapacity: 14,
      },
      {
        onSuccess: (data) => {
          const courses = (data?.courses ?? []).filter(
            (course) => course.suggestedClassCount > 0
          )
          if (courses.length === 0) {
            toast.error(t("demand.emptyDemand"))
            onSynced()
            return
          }
          applyMutation.mutate({
            termId,
            branchId: normalizedBranchId,
            instituteId: activeInstituteId || undefined,
            items: courses.map((course) => ({
              courseId: course.courseId,
              requiredClassCount: Math.max(1, course.suggestedClassCount),
              capacity: Math.max(1, course.suggestedCapacity || 14),
              deliveryMode:
                course.suggestedOnlineCount > course.suggestedInPersonCount
                  ? "ONLINE"
                  : "IN_PERSON",
              sessionDurationMinutes: 90,
              sessionsPerWeek: course.sessionsPerWeek ?? 3,
            })),
          })
        },
      }
    )
  }

  return {
    terms: termsQuery.data,
    requirements: requirementsQuery.data,
    isLoading: requirementsQuery.isLoading,
    create,
    update,
    remove,
    sync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSyncing: calculateMutation.isPending || applyMutation.isPending,
  }
}
