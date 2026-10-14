"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form"
import { ArrowLeft, ArrowRight } from "lucide-react"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PriceInput } from "@workspace/ui/components/price-input"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Badge } from "@workspace/ui/components/badge"
import { useIsRtl } from "@/i18n/routing"
import type {
  GenerateCoursesFromBookInput,
  BookDto,
  CourseDto,
} from "@workspace/types"

export interface FromBookFormProps {
  register: UseFormRegister<GenerateCoursesFromBookInput>
  control: Control<GenerateCoursesFromBookInput>
  errors: FieldErrors<GenerateCoursesFromBookInput>
  books: BookDto[]
  courses: CourseDto[]
  selectedBookId: string
  termsCount: number
  startingPrereqId?: string | null
}

export function FromBookForm({
  register,
  control,
  errors,
  books,
  courses,
  selectedBookId,
  termsCount,
  startingPrereqId,
}: FromBookFormProps) {
  const t = useTranslations("courses")
  const tb = useTranslations("books")
  const isRtl = useIsRtl()

  const bookOptions = React.useMemo(
    () => books.map((b) => ({ value: b.id, label: b.title })),
    [books]
  )

  const prerequisiteOptions = React.useMemo(
    () => [
      { value: "none", label: t("createModal.none") },
      ...courses.map((c) => ({ value: c.id, label: c.title })),
    ],
    [courses, t]
  )

  const currentBook = React.useMemo(
    () => books.find((b) => b.id === selectedBookId) || null,
    [books, selectedBookId]
  )

  const previewItems = React.useMemo(() => {
    if (!currentBook) return []
    const count = Math.min(Math.max(Number(termsCount) || 1, 1), 20)
    const label = tb("generateCoursesModal.namingFormatPart").split(" ")[0]
    const startingCourse = courses.find((c) => c.id === startingPrereqId)

    const items: { title: string; prerequisiteText: string }[] = []
    for (let i = 1; i <= count; i++) {
      const partSuffix = count === 1 ? "" : ` - ${label} ${i}`
      const title = `${currentBook.title}${partSuffix}`
      const prerequisiteText =
        i === 1
          ? (startingCourse?.title ?? tb("generateCoursesModal.noPrereq"))
          : (items[i - 2]?.title ?? "")
      items.push({ title, prerequisiteText })
    }
    return items
  }, [currentBook, termsCount, startingPrereqId, courses, tb])

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
      {/* Book selector */}
      <Field data-invalid={Boolean(errors.bookId)}>
        <FieldLabel>{t("createModal.selectBook")}</FieldLabel>
        <Controller
          control={control}
          name="bookId"
          render={({ field }) => (
            <ResponsiveCombobox
              items={bookOptions}
              value={field.value}
              onValueChange={(val) => field.onChange(val)}
              placeholder={t("createModal.selectBook")}
              drawerTitle={t("createModal.selectBook")}
              className="w-full"
            />
          )}
        />
        <FieldError>{errors.bookId?.message}</FieldError>
      </Field>

      {/* Number of terms */}
      <Field data-invalid={Boolean(errors.termsCount)}>
        <FieldLabel>{t("createModal.termsCount")}</FieldLabel>
        <Input
          type="number"
          min={1}
          max={20}
          {...register("termsCount", { valueAsNumber: true })}
          placeholder={t("createModal.termsCountPlaceholder")}
        />
        <FieldError>{errors.termsCount?.message}</FieldError>
        <FieldDescription>
          {tb("generateCoursesModal.termsCountHint")}
        </FieldDescription>
      </Field>

      {/* Base fee */}
      <Field data-invalid={Boolean(errors.baseFee)}>
        <FieldLabel>{t("createModal.baseFee")}</FieldLabel>
        <Controller
          control={control}
          name="baseFee"
          render={({ field }) => (
            <PriceInput
              value={field.value}
              onValueChange={(val) => field.onChange(val ?? 0)}
              placeholder={t("createModal.feePlaceholder")}
            />
          )}
        />
        <FieldError>{errors.baseFee?.message}</FieldError>
      </Field>

      {/* Starting Prerequisite */}
      <Field>
        <FieldLabel>{t("createModal.prerequisite")}</FieldLabel>
        <Controller
          control={control}
          name="startingPrerequisiteId"
          render={({ field }) => (
            <ResponsiveCombobox
              items={prerequisiteOptions}
              value={field.value || "none"}
              onValueChange={(val) =>
                field.onChange(val === "none" ? null : val)
              }
              placeholder={t("createModal.none")}
              drawerTitle={t("createModal.prerequisite")}
              className="w-full"
            />
          )}
        />
      </Field>

      {/* Live Preview */}
      {previewItems.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-muted/20 p-4">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("createModal.previewTitle")}
          </span>
          <div className="flex flex-col gap-2">
            {previewItems.map((item, idx) => (
              <div
                key={item.title}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background/80 px-3 py-2 text-sm shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {idx + 1}
                  </Badge>
                  <span className="font-medium text-foreground">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowIcon className="size-3 text-muted-foreground" />
                  <span>
                    {tb("generateCoursesModal.prereqLabel")}{" "}
                    <strong className="font-semibold text-foreground">
                      {item.prerequisiteText}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
