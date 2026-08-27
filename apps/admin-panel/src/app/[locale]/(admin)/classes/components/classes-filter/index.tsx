import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { PERMISSIONS } from "@workspace/types"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { termsResource, coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { AdminFilterBar } from "@/components/admin-filter-bar"
import { AdminSearchInput } from "@/components/admin-search-input"
import { PermissionGuard } from "@/components/permission-guard"

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

  const { data: termOptions = [{ value: "all", label: t("allTerms") }] } =
    useQuery({
      ...termsResource.list.toQuery(queryParams),
      enabled: !!activeInstituteId,
      select: (terms) => [
        { value: "all", label: t("allTerms") },
        ...terms.map((term) => ({ value: term.id, label: term.title })),
      ],
    })

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
    onTermChange("")
    onCourseChange("")
  }, [onTermChange, onCourseChange])

  const desktopActions =
    actions ??
    (onAddClick && (
      <PermissionGuard permission={PERMISSIONS.MANAGE_CLASSES} mode="hide">
        <Button
          type="button"
          onClick={onAddClick}
          className="h-14 shrink-0 cursor-pointer gap-2 rounded-2xl px-5 text-sm font-semibold shadow-xs"
        >
          <Plus className="size-5" />
          <span>{t("addClass")}</span>
        </Button>
      </PermissionGuard>
    ))

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
                onTermChange(val === "all" || !val ? "" : val)
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
