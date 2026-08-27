"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogCloseButton,
  ResponsiveDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  User,
  Phone,
  Home,
  FileText,
  GraduationCap,
  HeartHandshake,
} from "lucide-react"
import type { StudentDto } from "@workspace/types"
import { getAssetUrl } from "@workspace/ui/lib/utils"
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
    <ResponsiveDialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <ResponsiveDialogContent className="sm:max-h-[90vh] sm:max-w-xl">
        <ResponsiveDialogHeader className="mb-2 flex flex-row items-center justify-between">
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            <span>{t("profileModal.title")}</span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogCloseButton />
        </ResponsiveDialogHeader>

        <div className="space-y-4 px-6 pt-2 pb-6">
          {/* Header Card with Avatar */}
          <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-muted/20 p-4">
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
              <h3 className="text-base font-bold text-foreground">
                {fullName}
              </h3>
              <p className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                <Phone className="size-3" />
                <span className="font-mono">{student.phone}</span>
              </p>
            </div>
            <StudentStatusBadge isActive={student.isActive} />
          </div>

          {/* Identity & Personal Info */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <FileText className="size-4 text-primary" />
              <span>{t("profileModal.identityInfo")}</span>
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

          {/* Contact & Address */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Home className="size-4 text-primary" />
              <span>{t("profileModal.contactInfo")}</span>
            </h4>
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/80 p-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("createModal.emergencyPhone")}:{" "}
                </span>
                <p className="font-mono font-medium text-foreground">
                  {student.studentProfile?.emergencyPhone || "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">
                  {t("createModal.address")}:{" "}
                </span>
                <p className="font-medium text-foreground">
                  {student.studentProfile?.address || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
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
        </div>

        <ResponsiveDialogFooter className="p-4 sm:p-0 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 w-full rounded-xl sm:w-auto"
          >
            {t("profileModal.close")}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
