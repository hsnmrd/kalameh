"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  Eye,
  Edit,
  KeyRound,
  Phone,
  User,
  GraduationCap,
  ShieldAlert,
} from "lucide-react"
import { PERMISSIONS, type StudentDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { StudentStatusBadge } from "../student-status-badge"

export interface StudentCardProps {
  student: StudentDto
  onViewProfile: (student: StudentDto) => void
  onEdit: (student: StudentDto) => void
  onResetPassword: (student: StudentDto) => void
}

export function StudentCard({
  student,
  onViewProfile,
  onEdit,
  onResetPassword,
}: StudentCardProps) {
  const t = useTranslations("students")
  const fullName = `${student.firstName} ${student.lastName}`
  const initial = student.firstName?.[0] || student.lastName?.[0] || "S"

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
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
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{fullName}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3" />
              <span>{student.phone}</span>
            </p>
          </div>
        </div>

        <StudentStatusBadge isActive={student.isActive} />
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
        <div className="col-span-2 flex items-center gap-1 pt-1">
          <span className="font-medium text-foreground">
            {t("table.currentLevel")}:{" "}
          </span>
          {student.currentAllowedCourse ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <GraduationCap className="size-3" />
              <span>{student.currentAllowedCourse.title}</span>
            </Badge>
          ) : (
            <span>{t("table.noLevel")}</span>
          )}
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
