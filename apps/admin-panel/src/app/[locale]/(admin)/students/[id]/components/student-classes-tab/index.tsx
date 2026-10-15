"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  XCircle,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Link } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import type { StudentDto } from "@workspace/types"

export interface StudentClassesTabProps {
  student: StudentDto
}

export function StudentClassesTab({ student }: StudentClassesTabProps) {
  const t = useTranslations("common.profile.classes")
  const [filterType, setFilterType] = React.useState<
    "all" | "active" | "passed"
  >("all")

  const enrollments = student.enrollments || []

  const activeClasses = React.useMemo(() => {
    return enrollments.filter((e) => {
      if (e.isPassed === true) return false
      const termEnd = e.class?.term?.endDate
        ? new Date(e.class.term.endDate)
        : null
      if (termEnd && termEnd < new Date()) return false
      return true
    })
  }, [enrollments])

  const passedClasses = React.useMemo(() => {
    return enrollments.filter((e) => {
      if (e.isPassed === true) return true
      const termEnd = e.class?.term?.endDate
        ? new Date(e.class.term.endDate)
        : null
      if (termEnd && termEnd < new Date()) return true
      return false
    })
  }, [enrollments])

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-filter tabs */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFilterType("all")}
          className={cn(
            "h-10 cursor-pointer rounded-xl px-4 text-xs font-semibold",
            filterType === "all"
              ? "bg-muted text-foreground"
              : "text-muted-foreground"
          )}
        >
          <span>همه کلاس‌ها ({enrollments.length})</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFilterType("active")}
          className={cn(
            "h-10 cursor-pointer rounded-xl px-4 text-xs font-semibold",
            filterType === "active"
              ? "bg-muted text-foreground"
              : "text-muted-foreground"
          )}
        >
          <Clock className="size-3.5 text-inherit" />
          <span>
            {t("active")} ({activeClasses.length})
          </span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFilterType("passed")}
          className={cn(
            "h-10 cursor-pointer rounded-xl px-4 text-xs font-semibold",
            filterType === "passed"
              ? "bg-muted text-foreground"
              : "text-muted-foreground"
          )}
        >
          <CheckCircle2 className="size-3.5 text-inherit" />
          <span>
            {t("passed")} ({passedClasses.length})
          </span>
        </Button>
      </div>

      {/* Active Classes Section */}
      {(filterType === "all" || filterType === "active") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground sm:text-base">
              {t("active")}
            </h4>
            <Badge variant="secondary" className="h-5 px-2 text-[11px]">
              {activeClasses.length}
            </Badge>
          </div>

          {activeClasses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
              {t("noActive")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {activeClasses.map((enrollment) => {
                const cls = enrollment.class
                return (
                  <div
                    key={enrollment.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs transition-colors hover:border-border/80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <Link
                          href={`/classes/${cls.id}`}
                          className="text-sm font-bold text-foreground transition-colors hover:text-primary sm:text-base"
                        >
                          {cls.title}
                        </Link>
                        {cls.course?.title && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <GraduationCap className="size-3" />
                            <span>{cls.course.title}</span>
                          </span>
                        )}
                      </div>
                      <Badge
                        variant="success"
                        className="text-[11px] font-semibold"
                      >
                        {t("ongoingStatus")}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                      {cls.term?.title && (
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="size-3 text-muted-foreground" />
                          <span>{cls.term.title}</span>
                        </span>
                      )}
                      {cls.schedule && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="size-3 text-muted-foreground" />
                          <span>{cls.schedule}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Passed Classes Section */}
      {(filterType === "all" || filterType === "passed") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            <h4 className="text-sm font-bold text-foreground sm:text-base">
              {t("passed")}
            </h4>
            <Badge variant="secondary" className="h-5 px-2 text-[11px]">
              {passedClasses.length}
            </Badge>
          </div>

          {passedClasses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
              {t("noPassed")}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {passedClasses.map((enrollment) => {
                const cls = enrollment.class
                const isPassed = enrollment.isPassed ?? true
                return (
                  <div
                    key={enrollment.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs transition-colors hover:border-border/80"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <Link
                          href={`/classes/${cls.id}`}
                          className="text-sm font-bold text-foreground transition-colors hover:text-primary sm:text-base"
                        >
                          {cls.title}
                        </Link>
                        {cls.course?.title && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="size-3" />
                            <span>{cls.course.title}</span>
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={isPassed ? "success" : "destructive"}
                        className="gap-1 text-[11px] font-semibold"
                      >
                        {isPassed ? (
                          <CheckCircle2 className="size-3 text-inherit" />
                        ) : (
                          <XCircle className="size-3 text-inherit" />
                        )}
                        <span>
                          {isPassed ? t("passedStatus") : t("failedStatus")}
                        </span>
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {cls.term?.title && (
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="size-3 text-muted-foreground" />
                            <span>{cls.term.title}</span>
                          </span>
                        )}
                      </div>
                      {typeof enrollment.finalScore === "number" && (
                        <span className="font-semibold text-foreground">
                          {t("score", { score: enrollment.finalScore })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
