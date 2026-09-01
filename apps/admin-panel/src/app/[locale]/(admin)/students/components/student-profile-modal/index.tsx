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
import { Badge } from "@workspace/ui/components/badge"
import { Phone, GraduationCap } from "lucide-react"
import type { StudentDto } from "@workspace/types"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { StudentStatusBadge } from "../student-status-badge"
import { StudentProfileNotes } from "./student-profile-notes"

export interface StudentProfileModalProps {
  student: StudentDto | null
  open: boolean
  onClose: () => void
}

export function StudentProfileModal({
  student,
  open,
  onClose,
}: StudentProfileModalProps) {
  const t = useTranslations("students")
  const locale = useLocale()

  if (!student) return null

  const fullName = `${student.firstName} ${student.lastName}`
  const initial = student.firstName?.[0] || student.lastName?.[0] || "S"

  const formattedBirthDate = student.studentProfile?.birthDate
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
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
          <FormDialogTitle>{t("profileModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
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

          {/* Academic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.currentLevel")}
              </span>
              <div className="pt-1">
                {student.currentAllowedCourse ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs text-primary"
                  >
                    <GraduationCap className="size-3" />
                    <span>{student.currentAllowedCourse.title}</span>
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("table.noLevel")}
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.createdAt")}
              </span>
              <p className="font-medium text-foreground">
                {formattedCreatedDate}
              </p>
            </div>
          </div>
        </div>

        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-14 min-w-28 rounded-2xl px-6 text-base font-medium"
          >
            {t("profileModal.close")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
