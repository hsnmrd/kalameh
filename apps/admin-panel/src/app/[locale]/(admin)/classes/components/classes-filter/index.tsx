import * as React from "react"
import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { termsResource, coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { findCurrentActiveTerm } from "@workspace/types"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { ClassesActionButton } from "../classes-action-button"

export interface ClassesFilterProps {
  termId: string
  onTermChange: (termId: string) => void
  courseId: string
  onCourseChange: (courseId: string) => void
  search: string
  onSearchChange: (search: string) => void
  onAddClick?: () => void
  actions?: React.ReactNode
}

export function ClassesFilter({
  termId,
  onTermChange,
  courseId,
  onCourseChange,
  search,
  onSearchChange,
  onAddClick,
  actions,
}: ClassesFilterProps) {
  const t = useTranslations("classes")
  const { activeInstituteId } = useActiveInstitute()

  const queryParams = activeInstituteId
    ? { instituteId: activeInstituteId }
    : undefined

  const { data: terms = [] } = useQuery({
    ...termsResource.list.toQuery(queryParams),
    enabled: !!activeInstituteId,
  })

  const currentActiveTerm = React.useMemo(() => {
    return findCurrentActiveTerm(terms)
  }, [terms])

  const termOptions = React.useMemo(() => {
    return [
      { value: "all", label: t("allTerms") },
      ...terms.map((term) => ({
        value: term.id,
        label:
          term.id === currentActiveTerm?.id
            ? `${term.title} (${t("activeTermBadge")})`
            : term.title,
      })),
    ]
  }, [terms, currentActiveTerm, t])

  const { data: courseOptions = [{ value: "all", label: t("allCourses") }] } =
    useQuery({
      ...coursesResource.list.toQuery(queryParams),
      enabled: !!activeInstituteId,
      select: (courses) => [
        { value: "all", label: t("allCourses") },
        ...courses.map((course) => ({ value: course.id, label: course.title })),
      ],
    })

  const activeFiltersCount =
    (termId && termId !== "all" ? 1 : 0) +
    (courseId && courseId !== "all" ? 1 : 0)

  const hasActiveFilter = Boolean(search.trim() || activeFiltersCount > 0)

  const handleClearFilters = React.useCallback(() => {
    onTermChange("all")
    onCourseChange("")
  }, [onTermChange, onCourseChange])

  const desktopActions =
    actions ??
    (onAddClick ? <ClassesActionButton onAddClick={onAddClick} /> : undefined)

  return (
    <AdminFilterBar
      isPinned={hasActiveFilter}
      activeFiltersCount={activeFiltersCount}
      onClearFilters={handleClearFilters}
      actions={desktopActions}
      search={
        <AdminSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      }
      filters={
        <>
          <Field>
            <FieldLabel>{t("termFilter")}</FieldLabel>
            <ResponsiveCombobox
              items={termOptions}
              value={termId || "all"}
              onValueChange={(val) =>
                onTermChange(val === "all" || !val ? "all" : val)
              }
              placeholder={t("termFilter")}
              drawerTitle={t("termFilter")}
              clearable={false}
            />
          </Field>

          <Field>
            <FieldLabel>{t("courseFilter")}</FieldLabel>
            <ResponsiveCombobox
              items={courseOptions}
              value={courseId || "all"}
              onValueChange={(val) =>
                onCourseChange(val === "all" || !val ? "" : val)
              }
              placeholder={t("courseFilter")}
              drawerTitle={t("courseFilter")}
              clearable={false}
            />
          </Field>
        </>
      }
    />
  )
}
