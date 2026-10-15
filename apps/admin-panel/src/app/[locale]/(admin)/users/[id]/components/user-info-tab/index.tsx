"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Calendar, Phone, ShieldCheck, UserCheck, MapPin } from "lucide-react"
import type { AuthUser } from "@workspace/types"

export interface UserInfoTabProps {
  user: AuthUser
}

export function UserInfoTab({ user }: UserInfoTabProps) {
  const t = useTranslations("users")
  const locale = useLocale()

  const formattedCreatedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(new Date(user.createdAt))

  const formattedBirthDate = user.studentProfile?.birthDate
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(user.studentProfile.birthDate))
    : null

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* Identity Information Section */}
      <div>
        <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground sm:text-base">
          <UserCheck className="size-4 text-muted-foreground" />
          <span>
            {locale === "fa" ? "مشخصات هویتی و فردی" : "Personal Information"}
          </span>
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.name")}
            </span>
            <p className="mt-1 font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.nationalCode")}
            </span>
            <p className="mt-1 font-mono font-medium text-foreground">
              {user.nationalCode || "—"}
            </p>
          </div>

          {user.studentProfile?.fatherName && (
            <div>
              <span className="text-xs text-muted-foreground">
                {locale === "fa" ? "نام پدر" : "Father's Name"}
              </span>
              <p className="mt-1 font-medium text-foreground">
                {user.studentProfile.fatherName}
              </p>
            </div>
          )}

          {formattedBirthDate && (
            <div>
              <span className="text-xs text-muted-foreground">
                {locale === "fa" ? "تاریخ تولد" : "Birth Date"}
              </span>
              <p className="mt-1 font-medium text-foreground">
                {formattedBirthDate}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact & Address Section */}
      <div>
        <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground sm:text-base">
          <Phone className="size-4 text-muted-foreground" />
          <span>
            {locale === "fa" ? "اطلاعات تماس و نشانی" : "Contact & Address"}
          </span>
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.phone")}
            </span>
            <p className="mt-1 font-mono font-medium text-foreground" dir="ltr">
              {user.phone}
            </p>
          </div>

          {user.studentProfile?.emergencyPhone && (
            <div>
              <span className="text-xs text-muted-foreground">
                {locale === "fa" ? "شماره تماس اضطراری" : "Emergency Phone"}
              </span>
              <p
                className="mt-1 font-mono font-medium text-foreground"
                dir="ltr"
              >
                {user.studentProfile.emergencyPhone}
              </p>
            </div>
          )}

          {user.studentProfile?.address && (
            <div className="sm:col-span-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 text-muted-foreground" />
                <span>{locale === "fa" ? "نشانی" : "Address"}</span>
              </span>
              <p className="mt-1 text-sm font-medium text-foreground">
                {user.studentProfile.address}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* System & Access Section */}
      <div>
        <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground sm:text-base">
          <ShieldCheck className="size-4 text-muted-foreground" />
          <span>
            {locale === "fa" ? "دسترسی و وضعیت کاربری" : "Role & Access"}
          </span>
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.role")}
            </span>
            <p className="mt-1 font-semibold text-foreground">
              {t(`roles.${user.role}`)}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.status")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {user.isActive ? t("status.active") : t("status.inactive")}
            </p>
          </div>

          <div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3 text-muted-foreground" />
              <span>{t("table.createdAt")}</span>
            </span>
            <p className="mt-1 font-medium text-foreground">
              {formattedCreatedDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
