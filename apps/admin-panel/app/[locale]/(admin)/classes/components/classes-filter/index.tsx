"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@workspace/ui/components/input"
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/ui/components/combobox"
import { termsResource, coursesResource } from "@/lib/api"

export interface ClassesFilterProps {
  termId: string
  onTermChange: (termId: string) => void
  courseId: string
  onCourseChange: (courseId: string) => void
  search: string
  onSearchChange: (search: string) => void
}

export function ClassesFilter({
  termId,
  onTermChange,
  courseId,
  onCourseChange,
  search,
  onSearchChange,
}: ClassesFilterProps) {
  const t = useTranslations("classes")

  const { data: terms } = useQuery(termsResource.list.toQuery())
  const { data: courses } = useQuery(coursesResource.list.toQuery())

  const termOptions: ComboboxOption[] = React.useMemo(() => {
    const list: ComboboxOption[] = [{ value: "all", label: t("allTerms") }]
    if (terms) {
      terms.forEach((term) => {
        list.push({ value: term.id, label: term.title })
      })
    }
    return list
  }, [terms, t])

  const courseOptions: ComboboxOption[] = React.useMemo(() => {
    const list: ComboboxOption[] = [{ value: "all", label: t("allCourses") }]
    if (courses) {
      courses.forEach((course) => {
        list.push({ value: course.id, label: course.title })
      })
    }
    return list
  }, [courses, t])

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 rounded-xl border-slate-200 bg-white ps-9 text-sm"
        />
      </div>

      {/* Select Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Combobox
            items={termOptions}
            value={termId || "all"}
            onValueChange={(val) =>
              onTermChange(val === "all" || !val ? "" : val)
            }
            placeholder={t("termFilter")}
            className="w-full"
          />
        </div>

        <div className="w-48">
          <Combobox
            items={courseOptions}
            value={courseId || "all"}
            onValueChange={(val) =>
              onCourseChange(val === "all" || !val ? "" : val)
            }
            placeholder={t("courseFilter")}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
