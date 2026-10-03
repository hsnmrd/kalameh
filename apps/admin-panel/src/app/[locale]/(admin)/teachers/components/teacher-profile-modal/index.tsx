"use client"

import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  FormDialog,
  FormDialogCloseButton,
  FormDialogContent,
  FormDialogFooter,
  FormDialogHeader,
  FormDialogTitle,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import type { TeacherDto } from "@workspace/types"
import { teachersResource } from "@/lib/api"
import { AcademicInfo } from "./academic-info"
import { AvailabilitySchedule } from "./availability-schedule"
import { ProfileActions } from "./profile-actions"
import { ProfileSummary } from "./profile-summary"
import { TeachableCourses } from "./teachable-courses"
import { TeachingClasses } from "./teaching-classes"

export interface TeacherProfileModalProps {
  teacher: TeacherDto | null
  open: boolean
  onClose: () => void
  onEdit?: (teacher: TeacherDto) => void
  onManageAvailability?: (teacher: TeacherDto) => void
  onResetPassword?: (teacher: TeacherDto) => void
}

export function TeacherProfileModal({
  teacher,
  open,
  onClose,
  onEdit,
  onManageAvailability,
  onResetPassword,
}: TeacherProfileModalProps) {
  const t = useTranslations("teachers")
  const { data: detailedTeacher, isLoading } = useQuery({
    ...teachersResource.detail.toQuery(teacher?.id || ""),
    enabled: open && Boolean(teacher?.id),
  })
  const currentTeacher = detailedTeacher || teacher
  if (!currentTeacher) return null

  const fullName = `${currentTeacher.firstName} ${currentTeacher.lastName}`
  const initials = (
    currentTeacher.firstName?.[0] ||
    currentTeacher.lastName?.[0] ||
    "T"
  ).toUpperCase()

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-2xl">
        <FormDialogHeader>
          <div className="flex items-center gap-2">
            <ProfileActions
              teacher={currentTeacher}
              fullName={fullName}
              onClose={onClose}
              onEdit={onEdit}
              onManageAvailability={onManageAvailability}
              onResetPassword={onResetPassword}
            />
            <FormDialogTitle>{t("profileModal.title")}</FormDialogTitle>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Spinner className="size-8 text-foreground" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <ProfileSummary
              teacher={currentTeacher}
              fullName={fullName}
              initials={initials}
            />
            <AcademicInfo teacher={currentTeacher} />
            <TeachableCourses
              qualifications={
                currentTeacher.teacherProfile?.teachableCourses || []
              }
            />
            <AvailabilitySchedule
              teacher={currentTeacher}
              onClose={onClose}
              onManage={onManageAvailability}
            />
            <TeachingClasses teacher={currentTeacher} />
          </div>
        )}

        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 min-w-28 rounded-xl text-sm font-medium"
          >
            {t("profileModal.close")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
