"use client"

import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import {
  GenerateSchedulingPlanSchema,
  type ClassRequirementDto,
  type GenerateSchedulingPlanInput,
  type SchedulingRunDto,
} from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import {
  branchesResource,
  classRequirementsResource,
  schedulingResource,
  termsResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { isTermEligibleForScheduling } from "../helper/term-selection"

const defaultValues: GenerateSchedulingPlanInput = {
  termId: "",
  branchId: "",
  requirementIds: [],
  alternativePlanCount: 3,
  sourceRunId: null,
  lockedProposalIds: [],
}

export function useSchedulingGenerationForm(
  onCreated: (run: SchedulingRunDto) => void,
  successMessage: string
) {
  const { activeInstituteId } = useActiveInstitute()
  const scope = activeInstituteId
    ? { instituteId: activeInstituteId, isActive: true }
    : undefined
  const form = useForm<GenerateSchedulingPlanInput>({
    resolver: zodResolver(GenerateSchedulingPlanSchema),
    defaultValues,
  })
  const termId = useWatch({ control: form.control, name: "termId" })
  const branchId = useWatch({ control: form.control, name: "branchId" })
  const requirementIds = useWatch({
    control: form.control,
    name: "requirementIds",
  })
  const autoSelectedScopeRef = React.useRef("")
  const [isPreparing, setIsPreparing] = React.useState(false)

  const termsQuery = useQuery({
    ...termsResource.list.toQuery(scope),
    enabled: Boolean(activeInstituteId),
  })
  const branchesQuery = useQuery({
    ...branchesResource.list.toQuery(scope),
    enabled: Boolean(activeInstituteId),
  })
  const requirementsQuery = useQuery({
    ...classRequirementsResource.list.toQuery(
      activeInstituteId && termId
        ? { instituteId: activeInstituteId, termId, isActive: true }
        : undefined
    ),
    enabled: Boolean(activeInstituteId && termId),
  })

  const terms = React.useMemo(() => {
    return (termsQuery.data ?? []).filter((term) =>
      isTermEligibleForScheduling(term)
    )
  }, [termsQuery.data])

  const filterRequirementsForBranch = React.useCallback(
    (items: ClassRequirementDto[]) => {
      if (!branchId) return items
      return items.filter(
        (requirement) =>
          !requirement.branchId || requirement.branchId === branchId
      )
    },
    [branchId]
  )
  const requirements = React.useMemo(
    () => filterRequirementsForBranch(requirementsQuery.data ?? []),
    [filterRequirementsForBranch, requirementsQuery.data]
  )

  React.useEffect(() => {
    const scopeKey = `${termId}:${branchId ?? ""}`
    if (
      !requirementsQuery.isLoading &&
      termId &&
      autoSelectedScopeRef.current !== scopeKey
    ) {
      autoSelectedScopeRef.current = scopeKey
      form.setValue(
        "requirementIds",
        requirements.map((requirement) => requirement.id),
        { shouldValidate: true }
      )
      return
    }

    const visibleIds = new Set(requirements.map((item) => item.id))
    const nextIds = requirementIds.filter((id) => visibleIds.has(id))
    if (nextIds.length !== requirementIds.length) {
      form.setValue("requirementIds", nextIds, { shouldValidate: true })
    }
  }, [
    branchId,
    form,
    requirementIds,
    requirements,
    requirementsQuery.isLoading,
    termId,
  ])

  const generateMutation = useMutation({
    ...schedulingResource.generate.toMutation(),
    onSuccess: (run) => {
      toast.success(successMessage)
      onCreated(run)
    },
  })

  const submit = form.handleSubmit(async (values) => {
    if (!activeInstituteId) return

    setIsPreparing(true)
    try {
      const refreshed = await requirementsQuery.refetch()
      if (refreshed.isError || !refreshed.data) return

      const currentRequirements = filterRequirementsForBranch(refreshed.data)
      const currentIds = currentRequirements.map(({ id }) => id)
      const currentIdSet = new Set(currentIds)
      const stillSelectedIds = values.requirementIds.filter((id) =>
        currentIdSet.has(id)
      )
      const authoritativeIds =
        stillSelectedIds.length > 0 ? stillSelectedIds : currentIds

      form.setValue("requirementIds", authoritativeIds, {
        shouldValidate: true,
      })
      if (authoritativeIds.length === 0) return

      generateMutation.mutate({
        ...values,
        instituteId: activeInstituteId,
        requirementIds: authoritativeIds,
      })
    } finally {
      setIsPreparing(false)
    }
  })

  return {
    form,
    termId,
    requirementIds,
    terms,
    branches: branchesQuery.data ?? [],
    requirements,
    isScopeLoading: termsQuery.isLoading || branchesQuery.isLoading,
    isRequirementsLoading: requirementsQuery.isLoading,
    isPending: isPreparing || generateMutation.isPending,
    hasInstitute: Boolean(activeInstituteId),
    submit,
  }
}
