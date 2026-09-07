"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { FileText, Phone } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import type { TeacherDto } from "@workspace/types"

interface ProfileSummaryProps {
  teacher: TeacherDto
  fullName: string
  initials: string
}

export function ProfileSummary({
  teacher,
  fullName,
  initials,
}: ProfileSummaryProps) {
  const t = useTranslations("teachers")

  return (
    <div className="flex flex-row items-center gap-4 rounded-2xl border border-border/80 bg-muted/30 p-4 sm:p-5">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary sm:size-16 sm:text-xl">
        {teacher.avatarUrl ? (
          <Image
            src={getAssetUrl(teacher.avatarUrl)}
            alt={fullName}
            width={64}
            height={64}
            className="size-14 rounded-2xl object-cover sm:size-16"
            unoptimized
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-foreground sm:text-lg">
            {fullName}
          </h3>
          <Badge
            variant={teacher.isActive ? "outline" : "secondary"}
            className={
              teacher.isActive
                ? "border-success/30 bg-success/10 text-success"
                : "text-muted-foreground"
            }
          >
            {teacher.isActive ? t("status.active") : t("status.inactive")}
          </Badge>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:gap-4">
          <span className="flex items-center gap-1.5 font-mono" dir="ltr">
            <Phone className="size-3.5 text-muted-foreground" />
            {teacher.phone}
          </span>
          {teacher.nationalCode && (
            <span className="flex items-center gap-1.5 font-mono" dir="ltr">
              <FileText className="size-3.5 text-muted-foreground" />
              {teacher.nationalCode}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
