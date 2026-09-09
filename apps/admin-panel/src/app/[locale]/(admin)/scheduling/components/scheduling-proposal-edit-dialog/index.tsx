"use client"

import { useTranslations } from "next-intl"
import type { SchedulingPlanDetailsDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogDescription,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { useSchedulingProposalEditForm } from "../../hooks/use-scheduling-proposal-edit-form"
import { SchedulingProposalEditFields } from "../scheduling-proposal-edit-fields"

type Proposal = SchedulingPlanDetailsDto["proposals"][number]

interface SchedulingProposalEditDialogProps {
  proposal: Proposal
  open: boolean
  onClose: () => void
}

export function SchedulingProposalEditDialog({
  proposal,
  open,
  onClose,
}: SchedulingProposalEditDialogProps) {
  const t = useTranslations("scheduling.proposalEdit")
  const {
    form,
    teacherOptions,
    branchOptions,
    classroomOptions,
    selectedClassroom,
    optionsPending,
    updateMutation,
    onSubmit,
  } = useSchedulingProposalEditForm(proposal, open, onClose)

  return (
    <FormDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <div className="flex min-w-0 flex-col gap-1">
            <FormDialogTitle>{t("title")}</FormDialogTitle>
            <FormDialogDescription>
              {t("description", { course: proposal.course.title })}
            </FormDialogDescription>
          </div>
          <FormDialogCloseButton aria-label={t("close")} />
        </FormDialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <SchedulingProposalEditFields
              form={form}
              teacherOptions={teacherOptions}
              branchOptions={branchOptions}
              classroomOptions={classroomOptions}
              selectedClassroom={selectedClassroom}
              optionsPending={optionsPending}
            />
          </div>

          <FormDialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || optionsPending}
            >
              {updateMutation.isPending && <Spinner data-icon="inline-start" />}
              {updateMutation.isPending ? t("saving") : t("save")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
