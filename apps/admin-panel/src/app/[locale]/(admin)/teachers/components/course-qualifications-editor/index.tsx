"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { BookOpen, ChevronsUpDown, Search } from "lucide-react"
import type { CourseDto } from "@workspace/types"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { ResponsivePopover } from "@workspace/ui/components/popover"
import { Spinner } from "@workspace/ui/components/spinner"

interface CourseQualificationsEditorProps {
  courses: CourseDto[]
  value: string[]
  onChange: (courseIds: string[]) => void
  isLoading?: boolean
  disabled?: boolean
}

export function CourseQualificationsEditor({
  courses,
  value,
  onChange,
  isLoading = false,
  disabled = false,
}: CourseQualificationsEditorProps) {
  const t = useTranslations("teachers.qualifications")
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selected = React.useMemo(
    () => courses.filter((course) => value.includes(course.id)),
    [courses, value]
  )
  const filteredCourses = React.useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return query
      ? courses.filter((course) =>
          course.title.toLocaleLowerCase().includes(query)
        )
      : courses
  }, [courses, search])

  const toggleCourse = (courseId: string) => {
    onChange(
      value.includes(courseId)
        ? value.filter((id) => id !== courseId)
        : [...value, courseId]
    )
  }

  const content = (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="ps-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto overscroll-contain pe-1">
        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <Empty variant="compact" className="min-h-40">
            <EmptyHeader>
              <EmptyMedia>
                <BookOpen className="size-5 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredCourses.map((course) => {
              const checkboxId = `teacher-course-${course.id}`
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors hover:bg-muted/60"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={value.includes(course.id)}
                    onCheckedChange={() => toggleCourse(course.id)}
                  />
                  <FieldLabel
                    htmlFor={checkboxId}
                    className="min-w-0 flex-1 cursor-pointer font-medium"
                  >
                    {course.title}
                  </FieldLabel>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Field>
      <FieldLabel>{t("title")}</FieldLabel>
      <FieldDescription>{t("description")}</FieldDescription>
      <ResponsivePopover
        open={open}
        onOpenChange={setOpen}
        drawerTitle={t("title")}
        clearLabel={t("clear")}
        closeLabel={t("close")}
        onClear={value.length > 0 ? () => onChange([]) : undefined}
        align="start"
        className="w-[min(24rem,var(--available-width))] p-3"
        drawerBodyClassName="pb-2"
        trigger={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-11 w-full justify-between rounded-xl px-3 font-normal"
          >
            <span className="truncate text-muted-foreground">
              {value.length > 0
                ? t("selectedCount", { count: value.length })
                : t("placeholder")}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      >
        {content}
      </ResponsivePopover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label={t("selectedList")}>
          {selected.map((course) => (
            <Badge key={course.id} variant="secondary">
              {course.title}
            </Badge>
          ))}
        </div>
      )}
    </Field>
  )
}
