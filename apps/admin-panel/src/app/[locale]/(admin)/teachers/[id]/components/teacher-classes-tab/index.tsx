"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { BookOpen, Calendar, CheckCircle2, Clock, Users } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Link } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"
import type { TeacherDto } from "@workspace/types"

export interface TeacherClassesTabProps {
  teacher: TeacherDto
}

export function TeacherClassesTab({ teacher }: TeacherClassesTabProps) {
  const t = useTranslations("common.profile.classes")
  const [filterType, setFilterType] = React.useState<
    "all" | "active" | "passed"
  >("all")

  const classes = teacher.teachingClasses || []

  const activeClasses = React.useMemo(() => {
    return classes.filter((c) => {
      if (c.term?.isActive === false) return false
      const termEnd = c.term?.endDate ? new Date(c.term.endDate) : null
      if (termEnd && termEnd < new Date()) return false
      return true
    })
  }, [classes])

  const passedClasses = React.useMemo(() => {
    return classes.filter((c) => {
      if (c.term?.isActive === false) return true
      const termEnd = c.term?.endDate ? new Date(c.term.endDate) : null
      if (termEnd && termEnd < new Date()) return true
      return false
    })
  }, [classes])

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
          <span>همه کلاس‌ها ({classes.length})</span>
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
              {activeClasses.map((classroom) => (
                <div
                  key={classroom.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs transition-colors hover:border-border/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <Link
                        href={`/classes/${classroom.id}`}
                        className="text-sm font-bold text-foreground transition-colors hover:text-primary sm:text-base"
                      >
                        {classroom.title}
                      </Link>
                      {classroom.course?.title && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="size-3" />
                          <span>{classroom.course.title}</span>
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

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      {classroom.term?.title && (
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="size-3 text-muted-foreground" />
                          <span>{classroom.term.title}</span>
                        </span>
                      )}
                      {classroom.schedule && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="size-3 text-muted-foreground" />
                          <span>{classroom.schedule}</span>
                        </span>
                      )}
                    </div>

                    {typeof classroom.enrolledCount === "number" && (
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <Users className="size-3 text-muted-foreground" />
                        <span>
                          {t("enrolledCount", {
                            count: classroom.enrolledCount,
                          })}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Passed Classes Section */}
      {(filterType === "all" || filterType === "passed") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-muted-foreground" />
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
              {passedClasses.map((classroom) => (
                <div
                  key={classroom.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-2xs transition-colors hover:border-border/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <Link
                        href={`/classes/${classroom.id}`}
                        className="text-sm font-bold text-foreground transition-colors hover:text-primary sm:text-base"
                      >
                        {classroom.title}
                      </Link>
                      {classroom.course?.title && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="size-3" />
                          <span>{classroom.course.title}</span>
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[11px] font-semibold"
                    >
                      به پایان رسیده
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      {classroom.term?.title && (
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="size-3 text-muted-foreground" />
                          <span>{classroom.term.title}</span>
                        </span>
                      )}
                    </div>

                    {typeof classroom.enrolledCount === "number" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3 text-muted-foreground" />
                        <span>
                          {t("enrolledCount", {
                            count: classroom.enrolledCount,
                          })}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
