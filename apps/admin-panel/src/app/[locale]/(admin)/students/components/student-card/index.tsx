"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  Eye,
  Edit,
  KeyRound,
  Phone,
  GraduationCap,
  FileText,
  Check,
  Clock,
  Bookmark,
  CalendarCheck,
} from "lucide-react"
import { PERMISSIONS, type StudentDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { AvatarBadge } from "@workspace/ui/components/avatar"
import { getAssetUrl, formatCourseShortTitle } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"

export interface StudentCardProps {
  student: StudentDto
  onViewProfile: (student: StudentDto) => void
  onAddNote: (student: StudentDto) => void
  onEdit: (student: StudentDto) => void
  onResetPassword: (student: StudentDto) => void
}

export function StudentCard({
  student,
  onViewProfile,
  onAddNote,
  onEdit,
  onResetPassword,
}: StudentCardProps) {
  const t = useTranslations("students")
  const fullName = `${student.firstName} ${student.lastName}`
  const initial = student.firstName?.[0] || student.lastName?.[0] || "S"

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {student.avatarUrl ? (
              <Image
                src={getAssetUrl(student.avatarUrl)}
                alt={fullName}
                width={40}
                height={40}
                className="size-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <span>{initial}</span>
            )}
            {!student.isActive && (
              <AvatarBadge
                className="size-3 bg-muted-foreground"
                aria-label={t("status.inactive")}
                title={t("status.inactive")}
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-foreground">{fullName}</h3>
              {student.studentProfile?.scheduleStatus === "COMPLETE" && (
                <span
                  title={t("scheduleStatus.complete")}
                  className="inline-flex shrink-0 items-center text-success"
                >
                  <Check
                    className="size-3.5 text-inherit"
                    aria-label={t("scheduleStatus.complete")}
                  />
                </span>
              )}
              {student.studentProfile?.scheduleStatus === "INCOMPLETE" && (
                <span
                  title={t("scheduleStatus.incomplete")}
                  className="inline-flex shrink-0 items-center text-muted-foreground"
                >
                  <Clock
                    className="size-3.5 text-inherit"
                    aria-label={t("scheduleStatus.incomplete")}
                  />
                </span>
              )}
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3" />
              <span>{student.phone}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {student.studentProfile?.inWishlist && (
            <Badge
              variant="outline"
              className="gap-1 border-warning/40 bg-warning/15 text-xs text-warning"
            >
              <Bookmark className="size-3 text-inherit" />
              <span>{t("table.wishlistBadge")}</span>
            </Badge>
          )}
          {student.studentProfile?.targetTerm && (
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 bg-primary/10 text-xs text-primary"
              title={student.studentProfile.targetTerm.title}
            >
              <CalendarCheck className="size-3 text-inherit" />
              <span>{student.studentProfile.targetTerm.title}</span>
            </Badge>
          )}
          {student.currentAllowedCourse ? (
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 bg-primary/10 text-xs text-primary"
              title={student.currentAllowedCourse.title}
            >
              <GraduationCap className="size-3 text-inherit" />
              <span>
                {formatCourseShortTitle(student.currentAllowedCourse.title)}
              </span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-muted-foreground/30 bg-muted/40 text-xs text-muted-foreground"
            >
              <span>{t("table.noLevel")}</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">
            {t("table.fatherName")}:{" "}
          </span>
          <span>{student.studentProfile?.fatherName || "-"}</span>
        </div>
        <div>
          <span className="font-medium text-foreground">
            {t("table.nationalCode")}:{" "}
          </span>
          <span>{student.nationalCode || "-"}</span>
        </div>
        <div>
          <span className="font-medium text-foreground">
            {t("table.branch")}:{" "}
          </span>
          <span>{student.branch?.name || "-"}</span>
        </div>
        <div>
          <span className="font-medium text-foreground">
            {t("createModal.emergencyPhone")}:{" "}
          </span>
          <span className="font-mono">
            {student.studentProfile?.emergencyPhone || "-"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
        <PermissionGuard
          permission={PERMISSIONS.VIEW_STUDENTS}
          mode="disable"
          className="flex-1"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProfile(student)}
            className="w-full gap-1 text-xs"
          >
            <Eye className="size-3.5" />
            <span>{t("actions.viewProfile")}</span>
          </Button>
        </PermissionGuard>

        <PermissionGuard
          permission={PERMISSIONS.MANAGE_STUDENT_NOTES}
          mode="disable"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddNote(student)}
            className="gap-1 text-xs"
            title={t("actions.addNote")}
          >
            <FileText className="size-3.5" />
            <span>{t("actions.addNote")}</span>
          </Button>
        </PermissionGuard>

        <PermissionGuard
          permission={PERMISSIONS.MANAGE_STUDENTS}
          mode="disable"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(student)}
            className="gap-1 text-xs"
          >
            <Edit className="size-3.5" />
            <span>{t("actions.edit")}</span>
          </Button>
        </PermissionGuard>

        <PermissionGuard
          permission={PERMISSIONS.MANAGE_STUDENTS}
          mode="disable"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResetPassword(student)}
            className="text-xs"
            title={t("actions.resetPassword")}
          >
            <KeyRound className="size-3.5" />
          </Button>
        </PermissionGuard>
      </div>
    </div>
  )
}
