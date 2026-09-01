"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Edit, KeyRound, Eye, GraduationCap, FileText } from "lucide-react"
import type { StudentDto } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { StudentStatusBadge } from "../student-status-badge"

export interface StudentRowProps {
  student: StudentDto
  onViewProfile: (student: StudentDto) => void
  onAddNote: (student: StudentDto) => void
  onEdit: (student: StudentDto) => void
  onResetPassword: (student: StudentDto) => void
}

export function StudentRow({
  student,
  onViewProfile,
  onAddNote,
  onEdit,
  onResetPassword,
}: StudentRowProps) {
  const t = useTranslations("students")

  const fullName = `${student.firstName} ${student.lastName}`
  const initial = student.firstName?.[0] || student.lastName?.[0] || "S"

  return (
    <tr className="border-b border-border/60 transition-colors hover:bg-muted/40">
      {/* Name and Avatar */}
      <td className="p-4 align-middle">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {student.avatarUrl ? (
              <Image
                src={getAssetUrl(student.avatarUrl)}
                alt={fullName}
                width={36}
                height={36}
                className="size-9 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <div>
            <div className="font-semibold text-foreground">{fullName}</div>
            <div className="text-xs text-muted-foreground">{student.phone}</div>
          </div>
        </div>
      </td>

      {/* Father's Name */}
      <td className="p-4 align-middle text-sm text-foreground">
        {student.studentProfile?.fatherName || "-"}
      </td>

      {/* National Code */}
      <td className="p-4 align-middle font-mono text-sm text-muted-foreground">
        {student.nationalCode || "-"}
      </td>

      {/* Allowed Course Level */}
      <td className="p-4 align-middle text-sm">
        {student.currentAllowedCourse ? (
          <Badge
            variant="outline"
            className="gap-1 border-primary/30 text-primary"
          >
            <GraduationCap className="size-3" />
            <span>{student.currentAllowedCourse.title}</span>
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t("table.noLevel")}
          </span>
        )}
      </td>

      {/* Status */}
      <td className="p-4 align-middle">
        <StudentStatusBadge isActive={student.isActive} />
      </td>

      {/* Actions */}
      <td className="p-4 text-right align-middle">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewProfile(student)}
            title={t("actions.viewProfile")}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddNote(student)}
            title={t("actions.addNote")}
          >
            <FileText className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(student)}
            title={t("actions.edit")}
          >
            <Edit className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResetPassword(student)}
            title={t("actions.resetPassword")}
          >
            <KeyRound className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
