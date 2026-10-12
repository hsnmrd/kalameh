"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Phone, Clock } from "lucide-react"
import { type StudentDto } from "@workspace/types"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { StudentStatusBadge } from "../student-status-badge"
import { StudentProfileNotes } from "./student-profile-notes"
import { ProfileActions } from "./profile-actions"
import { StudentAcademicInfo } from "./student-academic-info"

export interface StudentProfileModalProps {
  student: StudentDto | null
  open: boolean
  onClose: () => void
  onAvailability?: (student: StudentDto) => void
  onEdit?: (student: StudentDto) => void
  onAddNote?: (student: StudentDto) => void
  onResetPassword?: (student: StudentDto) => void
}

export function StudentProfileModal({
  student,
  open,
  onClose,
  onAvailability,
  onEdit,
  onAddNote,
  onResetPassword,
}: StudentProfileModalProps) {
  const t = useTranslations("students")
  const locale = useLocale()

  if (!student) return null

  const fullName = `${student.firstName} ${student.lastName}`
  const initial = student.firstName?.[0] || student.lastName?.[0] || "S"

  const formattedBirthDate = student.studentProfile?.birthDate
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(student.studentProfile.birthDate))
    : "—"

  const formattedCreatedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(new Date(student.createdAt))

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-xl">
        <FormDialogHeader>
          <div className="flex items-center gap-2">
            <ProfileActions
              student={student}
              fullName={fullName}
              onClose={onClose}
              onAvailability={onAvailability}
              onEdit={onEdit}
              onAddNote={onAddNote}
              onResetPassword={onResetPassword}
            />
            <FormDialogTitle>{t("profileModal.title")}</FormDialogTitle>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {/* Header Card with Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {student.avatarUrl ? (
                <Image
                  src={getAssetUrl(student.avatarUrl)}
                  alt={fullName}
                  width={56}
                  height={56}
                  className="size-14 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground sm:text-lg">
                {fullName}
              </h3>
              <p className="flex items-center gap-1.5 pt-0.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" />
                <span className="font-mono">{student.phone}</span>
              </p>
            </div>
            <StudentStatusBadge isActive={student.isActive} />
          </div>

          {/* Identity & Personal Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <StudentProfileNotes
              key={student.id}
              studentId={student.id}
              initialNotes={student.studentProfile?.notes}
            />
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.fatherName")}
              </span>
              <p className="font-medium text-foreground">
                {student.studentProfile?.fatherName || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.nationalCode")}
              </span>
              <p className="font-mono font-medium text-foreground">
                {student.nationalCode || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("createModal.birthDate")}
              </span>
              <p className="font-medium text-foreground">
                {formattedBirthDate}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("createModal.gender")}
              </span>
              <p className="font-medium text-foreground">
                {student.studentProfile?.gender === "MALE"
                  ? t("createModal.genderMale")
                  : student.studentProfile?.gender === "FEMALE"
                    ? t("createModal.genderFemale")
                    : "—"}
              </p>
            </div>
          </div>

          {/* Contact & Address */}
          {(student.studentProfile?.emergencyPhone ||
            student.studentProfile?.address) && (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {student.studentProfile?.emergencyPhone && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    {t("createModal.emergencyPhone")}
                  </span>
                  <p className="font-mono font-medium text-foreground">
                    {student.studentProfile.emergencyPhone}
                  </p>
                </div>
              )}
              {student.studentProfile?.address && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    {t("createModal.address")}
                  </span>
                  <p className="font-medium text-foreground">
                    {student.studentProfile.address}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Academic & Branch Info */}
          <StudentAcademicInfo
            student={student}
            formattedCreatedDate={formattedCreatedDate}
          />
        </div>

        <FormDialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("profileModal.close")}
          </Button>
          {onAvailability && (
            <Button
              type="button"
              onClick={() => {
                onAvailability(student)
              }}
              className="gap-2"
            >
              <Clock className="size-4" />
              <span>{t("actions.availability")}</span>
            </Button>
          )}
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
