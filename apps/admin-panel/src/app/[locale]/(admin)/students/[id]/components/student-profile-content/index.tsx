"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { BookOpen, Calendar, Clock, FileText, User } from "lucide-react"
import { Spinner } from "@workspace/ui/components/spinner"
import { PERMISSIONS, APP_MODULES, type StudentDto } from "@workspace/types"
import { studentsResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { useModal } from "@/lib/hooks"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { AdminPageShell } from "@/components/admin-page-shell"
import { PermissionGuard } from "@/components/permission-guard"
import { ModuleGuard } from "@/components/module-guard"
import { ProfileSquareHeader } from "@/components/profile-square-header"
import { ProfileTabs, type ProfileTabOption } from "@/components/profile-tabs"
import { StudentScheduleStatusBadge } from "../../../components/student-schedule-status-badge"
import { EditStudentModal } from "../../../components/edit-student-modal"
import { StudentAvailabilityModal } from "../../../components/student-availability-modal"
import { AddStudentNoteModal } from "../../../components/add-student-note-modal"
import { ResetPasswordModal } from "../../../components/reset-password-modal"
import { StudentActionsMenu } from "../student-actions-menu"
import { StudentInfoTab } from "../student-info-tab"
import { StudentClassesTab } from "../student-classes-tab"
import { StudentScheduleTab } from "../student-schedule-tab"
import { StudentNotesTab } from "../student-notes-tab"

export interface StudentProfileContentProps {
  studentId: string
}

type StudentProfileTab = "information" | "classes" | "schedule" | "notes"

export function StudentProfileContent({
  studentId,
}: StudentProfileContentProps) {
  const t = useTranslations("students")
  const tCommon = useTranslations("common")
  const { activeInstituteId } = useActiveInstitute()
  const { isModalOpen, openModal, closeModal } = useModal()
  const [activeTab, setActiveTab] =
    React.useState<StudentProfileTab>("information")

  const { data: student, isLoading } = useQuery({
    ...studentsResource.detail.toQuery(studentId),
    enabled: Boolean(studentId),
  })

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Spinner className="size-8 text-foreground" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center text-center">
        <p className="text-base font-semibold text-foreground">
          {t("table.empty")}
        </p>
      </div>
    )
  }

  const fullName = `${student.firstName} ${student.lastName}`
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`
  const enrollmentsCount =
    student.enrollments?.length ?? student.enrollmentsCount ?? 0
  const availabilitiesCount =
    student.studentProfile?.availabilities?.length ?? 0
  const notesCount = student.studentProfile?.notes?.length ?? 0

  const tabOptions: ProfileTabOption<StudentProfileTab>[] = [
    {
      key: "information",
      label: tCommon("profile.tabs.information"),
      icon: <User className="size-4" />,
    },
    {
      key: "classes",
      label: tCommon("profile.tabs.classes"),
      count: enrollmentsCount,
      icon: <BookOpen className="size-4" />,
    },
    {
      key: "schedule",
      label: tCommon("profile.tabs.schedule"),
      count: availabilitiesCount,
      icon: <Clock className="size-4" />,
    },
    {
      key: "notes",
      label: tCommon("profile.tabs.notes"),
      count: notesCount,
      icon: <FileText className="size-4" />,
    },
  ]

  const handleEdit = () => {
    openModal("editStudent")
  }

  const handleAvailability = () => {
    openModal("availabilityStudent")
  }

  const handleAddNote = () => {
    openModal("addNote")
  }

  const handleResetPassword = () => {
    openModal("resetPassword")
  }

  return (
    <ModuleGuard module={APP_MODULES.STUDENTS}>
      <PermissionGuard permission={PERMISSIONS.VIEW_STUDENTS} mode="forbidden">
        <AdminPageShell
          breadcrumbClassName="hidden sm:block"
          breadcrumb={
            <AdminBreadcrumb
              backHref="/students"
              backLabel={t("title")}
              items={[
                { label: t("title"), href: "/students" },
                { label: fullName },
              ]}
            />
          }
        >
          <div className="flex flex-col gap-5 pb-8">
            {/* Unified Square Profile Header (Mobile: Square Image with Gradient; Desktop: Clean Banner) */}
            <ProfileSquareHeader
              fullName={fullName}
              phone={student.phone}
              avatarUrl={student.avatarUrl}
              initials={initials}
              topLeftBadge={
                <StudentScheduleStatusBadge
                  scheduleStatus={student.studentProfile?.scheduleStatus}
                  showLabel
                />
              }
              actions={
                <StudentActionsMenu
                  student={student}
                  onEdit={handleEdit}
                  onAvailability={handleAvailability}
                  onAddNote={handleAddNote}
                  onResetPassword={handleResetPassword}
                />
              }
            />

            {/* Profile Tab Selector */}
            <ProfileTabs
              options={tabOptions}
              value={activeTab}
              onChange={setActiveTab}
            />

            {/* Tab Contents */}
            <div className="min-h-[calc(100dvh-4rem)]">
              {activeTab === "information" && (
                <StudentInfoTab student={student} />
              )}
              {activeTab === "classes" && (
                <StudentClassesTab student={student} />
              )}
              {activeTab === "schedule" && (
                <StudentScheduleTab
                  student={student}
                  onManageAvailability={handleAvailability}
                />
              )}
              {activeTab === "notes" && (
                <StudentNotesTab student={student} onAddNote={handleAddNote} />
              )}
            </div>
          </div>

          {/* Action Modals */}
          <EditStudentModal
            student={student}
            open={isModalOpen("editStudent")}
            onClose={() => closeModal("editStudent")}
          />

          <StudentAvailabilityModal
            student={student}
            open={isModalOpen("availabilityStudent")}
            onClose={() => closeModal("availabilityStudent")}
            instituteId={activeInstituteId || student.instituteId}
          />

          <AddStudentNoteModal
            student={student}
            open={isModalOpen("addNote")}
            onClose={() => closeModal("addNote")}
          />

          <ResetPasswordModal
            student={student}
            open={isModalOpen("resetPassword")}
            onClose={() => closeModal("resetPassword")}
          />
        </AdminPageShell>
      </PermissionGuard>
    </ModuleGuard>
  )
}
