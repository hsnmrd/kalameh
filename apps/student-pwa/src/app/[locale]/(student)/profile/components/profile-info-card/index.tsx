"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { UserCheck } from "lucide-react"

export interface ProfileInfoCardProps {
  fullName: string
  nationalCode?: string | null
  fatherName?: string | null
  birthDate?: string | null
  gender?: string | null
}

export function ProfileInfoCard({
  fullName,
  nationalCode,
  fatherName,
  birthDate,
  gender,
}: ProfileInfoCardProps) {
  const t = useTranslations("profile")

  const genderLabel =
    gender === "MALE"
      ? t("genderMale")
      : gender === "FEMALE"
        ? t("genderFemale")
        : gender || "—"

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xs">
      <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground">
        <UserCheck className="size-4 text-muted-foreground" />
        <span>{t("personalInfo")}</span>
      </h3>

      <div className="grid grid-cols-2 gap-3.5 pt-1 text-xs sm:text-sm">
        <div>
          <span className="text-xs text-muted-foreground">{t("name")}</span>
          <p className="mt-1 font-medium text-foreground">{fullName}</p>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">
            {t("nationalCode")}
          </span>
          <p className="mt-1 font-medium text-foreground">
            <span dir="ltr">{nationalCode || "—"}</span>
          </p>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">
            {t("fatherName")}
          </span>
          <p className="mt-1 font-medium text-foreground">
            {fatherName || "—"}
          </p>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">
            {t("birthDate")}
          </span>
          <p className="mt-1 font-medium text-foreground">{birthDate || "—"}</p>
        </div>

        <div>
          <span className="text-xs text-muted-foreground">{t("gender")}</span>
          <p className="mt-1 font-medium text-foreground">{genderLabel}</p>
        </div>
      </div>
    </div>
  )
}
