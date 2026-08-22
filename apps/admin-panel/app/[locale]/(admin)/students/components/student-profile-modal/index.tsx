"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  User,
  Phone,
  Calendar,
  Home,
  FileText,
  GraduationCap,
  HeartHandshake,
} from "lucide-react"
import type { StudentDto } from "@workspace/types"
import { StudentStatusBadge } from "../student-status-badge"

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPopup className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("profileModal.title")}</DialogTitle>
          <DialogDescription>{t("profileModal.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Card */}
          <div className="flex items-center gap-4 rounded-2xl bg-muted/40 p-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-xs">
              {student.avatarUrl ? (
                <img
                  src={student.avatarUrl}
                  alt={fullName}
                  className="size-16 rounded-2xl object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">
                  {fullName}
                </h3>
                <StudentStatusBadge isActive={student.isActive} />
              </div>
              <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Phone className="size-3.5" />
                <span>{student.phone}</span>
              </p>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              <User className="size-4 text-primary" />
              <span>{t("profileModal.personalInfo")}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 p-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("table.fatherName")}:{" "}
                </span>
                <p className="font-medium text-foreground">
                  {student.studentProfile?.fatherName || "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("table.nationalCode")}:{" "}
                </span>
                <p className="font-mono font-medium text-foreground">
                  {student.nationalCode || "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("createModal.birthDate")}:{" "}
                </span>
                <p className="font-medium text-foreground">
                  {formattedBirthDate}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("createModal.gender")}:{" "}
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
          </div>

          {/* Guardian & Emergency */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              <HeartHandshake className="size-4 text-primary" />
              <span>{t("profileModal.guardianInfo")}</span>
            </h4>
            <div className="space-y-2 rounded-xl border border-border/80 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t("createModal.emergencyPhone")}:
                </span>
                <span className="font-mono font-medium text-foreground">
                  {student.studentProfile?.emergencyPhone || "—"}
                </span>
              </div>
              {student.studentProfile?.address && (
                <div className="flex items-start gap-2 border-t border-border/60 pt-2 text-xs">
                  <Home className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">
                    {student.studentProfile.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              <GraduationCap className="size-4 text-primary" />
              <span>{t("profileModal.academicInfo")}</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 p-3 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("table.currentLevel")}:{" "}
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
                  {t("table.createdAt")}:{" "}
                </span>
                <p className="font-medium text-foreground">
                  {formattedCreatedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-xl"
            >
              {t("profileModal.close")}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  )
}
