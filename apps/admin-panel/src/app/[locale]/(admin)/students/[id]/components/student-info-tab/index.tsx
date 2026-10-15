"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { GraduationCap, Phone, UserCheck } from "lucide-react"
import type { StudentDto } from "@workspace/types"

export interface StudentInfoTabProps {
  student: StudentDto
}

export function StudentInfoTab({ student }: StudentInfoTabProps) {
  const t = useTranslations("students")
  const locale = useLocale()

  const formattedCreatedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(new Date(student.createdAt))

  const formattedBirthDate = student.studentProfile?.birthDate
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(student.studentProfile.birthDate))
    : null

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* Identity & Personal Info Section */}
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
            <p className="mt-1 font-medium text-foreground">
              {student.firstName} {student.lastName}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.nationalCode")}
            </span>
            <p className="mt-1 text-start font-medium text-foreground">
              <span dir="ltr" className="inline-block">
                {student.nationalCode || "—"}
              </span>
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.fatherName")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {student.studentProfile?.fatherName || "—"}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("createModal.birthDate")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {formattedBirthDate || "—"}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("createModal.gender")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {student.studentProfile?.gender === "MALE"
                ? t("createModal.genderMale")
                : student.studentProfile?.gender === "FEMALE"
                  ? t("createModal.genderFemale")
                  : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Academic & Branch Info Section */}
      <div>
        <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground sm:text-base">
          <GraduationCap className="size-4 text-muted-foreground" />
          <span>
            {locale === "fa" ? "اطلاعات آموزشی و شعبه" : "Academic Information"}
          </span>
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.branch")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {student.branch?.name || "—"}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.currentLevel")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {student.currentAllowedCourse?.title || t("table.noLevel")}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.status")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {student.isActive ? t("status.active") : t("status.inactive")}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("actions.availability")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {student.studentProfile?.scheduleStatus === "COMPLETE"
                ? t("scheduleStatus.complete")
                : t("scheduleStatus.incomplete")}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.createdAt")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {formattedCreatedDate}
            </p>
          </div>
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
              {t("createModal.phone")}
            </span>
            <p className="mt-1 text-start font-medium text-foreground">
              <span dir="ltr" className="inline-block">
                {student.phone}
              </span>
            </p>
          </div>

          {student.studentProfile?.emergencyPhone && (
            <div>
              <span className="text-xs text-muted-foreground">
                {t("createModal.emergencyPhone")}
              </span>
              <p className="mt-1 text-start font-medium text-foreground">
                <span dir="ltr" className="inline-block">
                  {student.studentProfile.emergencyPhone}
                </span>
              </p>
            </div>
          )}

          {student.studentProfile?.address && (
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">
                {t("createModal.address")}
              </span>
              <p className="mt-1 text-sm font-medium text-foreground">
                {student.studentProfile.address}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
