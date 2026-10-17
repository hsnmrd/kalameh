"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { GraduationCap, ShieldCheck } from "lucide-react"

export interface ProfileAcademicCardProps {
  instituteName?: string | null
  role: string
  isActive: boolean
  memberSince?: string | null
}

export function ProfileAcademicCard({
  instituteName,
  role,
  isActive,
  memberSince,
}: ProfileAcademicCardProps) {
  const t = useTranslations("profile")

  return (
    <div className="flex flex-col gap-4 py-2">
      <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground">
        <GraduationCap className="size-4 text-muted-foreground" />
        <span>{t("academicInfo")}</span>
      </h3>

      <div className="grid grid-cols-2 gap-3.5 pt-1 text-xs sm:text-sm">
        <div>
          <span className="text-xs text-muted-foreground">
            {t("institute")}
          </span>
          <p className="mt-1 font-medium text-foreground">
            {instituteName || "—"}
          </p>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">
            {t("accountRole")}
          </span>
          <p className="mt-1 font-medium text-foreground">
            {role === "STUDENT" ? t("studentRole") : role}
          </p>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">
            {t("accountStatus")}
          </span>
          <p className="mt-1 flex items-center gap-1 font-semibold text-success">
            <ShieldCheck className="size-3.5" />
            <span>{isActive ? t("active") : t("suspended")}</span>
          </p>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">
            {t("memberSince")}
          </span>
          <p className="mt-1 font-medium text-foreground">
            {memberSince || "—"}
          </p>
        </div>
      </div>
    </div>
  )
}
