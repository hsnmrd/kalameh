"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { UserCheck } from "lucide-react"
import type { TeacherDto } from "@workspace/types"
import { TeachableCoursesCarousel } from "./teachable-courses-carousel"

export interface TeacherInfoTabProps {
  teacher: TeacherDto
}

export function TeacherInfoTab({ teacher }: TeacherInfoTabProps) {
  const t = useTranslations("teachers")
  const locale = useLocale()

  const formattedCreatedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(new Date(teacher.createdAt))

  const teachableCourses = teacher.teacherProfile?.teachableCourses || []

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* Identity & Academic Details Section */}
      <div>
        <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground sm:text-base">
          <UserCheck className="size-4 text-muted-foreground" />
          <span>
            {locale === "fa"
              ? "مشخصات هویتی و مدارک"
              : "Personal & Academic Info"}
          </span>
        </h3>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.name")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {teacher.firstName} {teacher.lastName}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.nationalCode")}
            </span>
            <p className="mt-1 text-start font-medium text-foreground">
              <span dir="ltr" className="inline-block">
                {teacher.nationalCode || "—"}
              </span>
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("createModal.phone")}
            </span>
            <p className="mt-1 text-start font-medium text-foreground">
              <span dir="ltr" className="inline-block">
                {teacher.phone}
              </span>
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.degree")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {teacher.teacherProfile?.degree || "—"}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.status")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {teacher.isActive ? t("status.active") : t("status.inactive")}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("createModal.createdAt") ||
                (locale === "fa" ? "تاریخ عضویت" : "Join Date")}
            </span>
            <p className="mt-1 font-medium text-foreground">
              {formattedCreatedDate}
            </p>
          </div>
        </div>

        {/* Bio / Background */}
        {teacher.teacherProfile?.bio && (
          <div className="mt-4 border-t border-border/40 pt-4">
            <span className="text-xs text-muted-foreground">
              {t("createModal.bio")}
            </span>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {teacher.teacherProfile.bio}
            </p>
          </div>
        )}
      </div>

      {/* Teachable Courses Section */}
      <TeachableCoursesCarousel teachableCourses={teachableCourses} />
    </div>
  )
}
