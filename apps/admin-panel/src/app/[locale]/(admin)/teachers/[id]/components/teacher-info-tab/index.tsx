"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Calendar,
  GraduationCap,
  Building2,
  Phone,
  UserCheck,
  BookOpen,
  FileText,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import type { TeacherDto } from "@workspace/types"

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
            <p className="mt-1 font-semibold text-foreground">
              {teacher.firstName} {teacher.lastName}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("table.nationalCode")}
            </span>
            <p className="mt-1 font-mono font-medium text-foreground">
              {teacher.nationalCode || "—"}
            </p>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              {t("createModal.phone")}
            </span>
            <p className="mt-1 font-mono font-medium text-foreground" dir="ltr">
              {teacher.phone}
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
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3 text-muted-foreground" />
              <span>
                {t("createModal.createdAt") ||
                  (locale === "fa" ? "تاریخ عضویت" : "Join Date")}
              </span>
            </span>
            <p className="mt-1 font-medium text-foreground">
              {formattedCreatedDate}
            </p>
          </div>
        </div>

        {/* Bio / Background */}
        {teacher.teacherProfile?.bio && (
          <div className="mt-4 border-t border-border/40 pt-4">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3 text-muted-foreground" />
              <span>{t("createModal.bio")}</span>
            </span>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {teacher.teacherProfile.bio}
            </p>
          </div>
        )}
      </div>

      {/* Teachable Courses Section */}
      <div>
        <h3 className="flex items-center gap-2 border-b border-border/60 pb-3 text-sm font-bold text-foreground sm:text-base">
          <BookOpen className="size-4 text-muted-foreground" />
          <span>
            {locale === "fa" ? "دوره‌های مجاز برای تدریس" : "Teachable Courses"}
          </span>
          <Badge variant="secondary" className="ms-auto h-5 px-2 text-[11px]">
            {teachableCourses.length} دوره
          </Badge>
        </h3>

        <div className="mt-4">
          {teachableCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
              {locale === "fa"
                ? "هنوز دوره‌ای برای تدریس این استاد ثبت نشده است."
                : "No teachable courses registered yet."}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teachableCourses.map((qualification) => (
                <Badge
                  key={qualification.id || qualification.courseId}
                  variant="outline"
                  className="gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  <GraduationCap className="size-3.5 text-primary" />
                  <span>{qualification.course?.title || "دوره آموزشی"}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
