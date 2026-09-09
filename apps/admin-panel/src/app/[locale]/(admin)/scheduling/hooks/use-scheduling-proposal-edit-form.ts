"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  UpdateSchedulingProposalSchema,
  type SchedulingPlanDetailsDto,
  type UpdateSchedulingProposalInput,
} from "@workspace/types"
import { toast } from "@workspace/ui/components/sonner"
import {
  branchesResource,
  classroomsResource,
  schedulingResource,
  teachersResource,
} from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

export function useSchedulingProposalEditForm(
  proposal: Proposal,
  open: boolean,
  onClose: () => void
) {
  const t = useTranslations("scheduling.proposalEdit")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const queryParams = { instituteId: activeInstituteId, isActive: true }
  const form = useForm<UpdateSchedulingProposalInput>({
    resolver: zodResolver(UpdateSchedulingProposalSchema),
    defaultValues: proposalDefaults(proposal),
  })
  const { reset, setError, setValue } = form

  React.useEffect(() => {
    if (open) reset(proposalDefaults(proposal))
  }, [open, proposal, reset])

  const { data: teachers = [], isPending: areTeachersPending } = useQuery({
    ...teachersResource.list.toQuery(queryParams),
    enabled: open && Boolean(activeInstituteId),
  })
  const { data: branches = [], isPending: areBranchesPending } = useQuery({
    ...branchesResource.list.toQuery(queryParams),
    enabled: open && Boolean(activeInstituteId),
  })
  const { data: classrooms = [], isPending: areClassroomsPending } = useQuery({
    ...classroomsResource.list.toQuery(queryParams),
    enabled: open && Boolean(activeInstituteId),
  })

  const [branchId, classroomId, deliveryMode, watchedCapacity] = useWatch({
    control: form.control,
    name: ["branchId", "classroomId", "deliveryMode", "capacity"],
  })
  const capacity = watchedCapacity ?? proposal.capacity
  const selectedClassroom = classrooms.find((room) => room.id === classroomId)

  React.useEffect(() => {
    if (deliveryMode === "ONLINE" && classroomId) {
      setValue("classroomId", null, { shouldValidate: true })
    }
  }, [classroomId, deliveryMode, setValue])

  React.useEffect(() => {
    if (
      selectedClassroom?.branchId &&
      branchId &&
      selectedClassroom.branchId !== branchId
    ) {
      setValue("classroomId", null, { shouldValidate: true })
    }
  }, [branchId, selectedClassroom, setValue])

  const teacherOptions = teachers
    .filter((teacher) =>
      teacher.teacherProfile?.teachableCourses.some(
        (qualification) => qualification.courseId === proposal.courseId
      )
    )
    .map((teacher) => ({
      value: teacher.id,
      label: `${teacher.firstName} ${teacher.lastName}`,
    }))
  const branchOptions = branches.map((branch) => ({
    value: branch.id,
    label: branch.name,
  }))
  const classroomOptions = classrooms
    .filter((room) => !branchId || !room.branchId || room.branchId === branchId)
    .map((room) => ({
      value: room.id,
      label: t("classroomOption", { name: room.name, capacity: room.capacity }),
      disabled: room.capacity < capacity,
    }))

  const updateMutation = useMutation({
    ...schedulingResource.updateProposal.toMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: schedulingResource.planDetail.key({
          planId: proposal.planId,
          instituteId: activeInstituteId,
        }),
      })
      toast.success(t("success"))
      onClose()
    },
  })

  const onSubmit = (values: UpdateSchedulingProposalInput) => {
    if (values.deliveryMode === "IN_PERSON" && !values.classroomId) {
      setError("classroomId", { type: "custom" })
      return
    }
    if (
      selectedClassroom &&
      values.capacity &&
      selectedClassroom.capacity < values.capacity
    ) {
      setError("classroomId", { type: "custom" })
      return
    }
    updateMutation.mutate({
      planId: proposal.planId,
      proposalId: proposal.id,
      instituteId: activeInstituteId,
      body: {
        ...values,
        branchId: values.branchId ?? null,
        classroomId:
          values.deliveryMode === "ONLINE"
            ? null
            : (values.classroomId ?? null),
      },
    })
  }

  return {
    form,
    teacherOptions,
    branchOptions,
    classroomOptions,
    selectedClassroom,
    optionsPending:
      areTeachersPending || areBranchesPending || areClassroomsPending,
    updateMutation,
    onSubmit,
  }
}

const proposalDefaults = (
  proposal: Proposal
): UpdateSchedulingProposalInput => ({
  title: proposal.title,
  teacherId: proposal.teacherId,
  branchId: proposal.branchId ?? null,
  classroomId: proposal.classroomId ?? null,
  capacity: proposal.capacity,
  deliveryMode: proposal.deliveryMode,
  daysOfWeek: proposal.daysOfWeek,
  startTime: proposal.startTime,
  endTime: proposal.endTime,
})
