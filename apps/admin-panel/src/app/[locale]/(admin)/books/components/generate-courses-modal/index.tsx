"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Layers } from "lucide-react"
import { toast } from "@workspace/ui/components/sonner"
import type { BookDto, CourseNamingFormat } from "@workspace/types"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { PriceInput } from "@workspace/ui/components/price-input"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@workspace/ui/components/field"
import { ResponsiveCombobox } from "@workspace/ui/components/combobox"
import { Spinner } from "@workspace/ui/components/spinner"
import { booksResource, coursesResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import { CoursesPreviewCarousel } from "./courses-preview-carousel"
import {
  useGenerateCoursesFromBookSchema,
  type GenerateCoursesFromBookInput,
} from "../../hooks/use-book-schemas"

export interface GenerateCoursesModalProps {
  open: boolean
  onClose: () => void
  book?: BookDto | null
}

export function GenerateCoursesModal({
  open,
  onClose,
  book: initialBook,
}: GenerateCoursesModalProps) {
  const t = useTranslations("books")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const generateSchema = useGenerateCoursesFromBookSchema()

  // Books list (in case modal was opened without a specific pre-selected book)
  const { data: allBooks = [] } = useQuery({
    ...booksResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: open && !!activeInstituteId,
  })

  // Existing courses for starting prerequisite option
  const { data: allCourses = [] } = useQuery({
    ...coursesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: open && !!activeInstituteId,
  })

  const prerequisiteOptions = React.useMemo(
    () => [
      { value: "none", label: t("generateCoursesModal.none") },
      ...allCourses.map((c) => ({ value: c.id, label: c.title })),
    ],
    [allCourses, t]
  )

  const bookOptions = React.useMemo(
    () => allBooks.map((b) => ({ value: b.id, label: b.title })),
    [allBooks]
  )

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GenerateCoursesFromBookInput>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      bookId: initialBook?.id || "",
      termsCount: 3,
      baseFee: 1500000,
      startingPrerequisiteId: null,
      namingFormat: "PART",
    },
  })

  const selectedBookId = watch("bookId")
  const termsCount = watch("termsCount") || 1
  const namingFormat = (watch("namingFormat") || "PART") as CourseNamingFormat
  const startingPrereqId = watch("startingPrerequisiteId")

  React.useEffect(() => {
    if (open) {
      reset({
        bookId: initialBook?.id || (allBooks[0]?.id ?? ""),
        termsCount: 3,
        baseFee: 1500000,
        startingPrerequisiteId: null,
        namingFormat: "PART",
      })
    }
  }, [open, initialBook, allBooks, reset])

  const currentBook = React.useMemo(() => {
    if (initialBook) return initialBook
    return allBooks.find((b) => b.id === selectedBookId) || null
  }, [initialBook, allBooks, selectedBookId])

  // Live preview computation of generated courses chain
  const previewItems = React.useMemo(() => {
    if (!currentBook) return []
    const count = Math.min(Math.max(Number(termsCount) || 1, 1), 20)
    const label = namingFormat === "TERM" ? "Term" : "Part"

    const startingCourse = allCourses.find((c) => c.id === startingPrereqId)

    const items: { title: string; prerequisiteText: string }[] = []
    for (let i = 1; i <= count; i++) {
      const partSuffix = count === 1 ? "" : ` - ${label} ${i}`
      const title = `${currentBook.title}${partSuffix}`
      const prerequisiteText =
        i === 1
          ? (startingCourse?.title ?? t("generateCoursesModal.noPrereq"))
          : (items[i - 2]?.title ?? "")
      items.push({ title, prerequisiteText })
    }
    return items
  }, [currentBook, termsCount, namingFormat, startingPrereqId, allCourses, t])

  const generateMutation = useMutation({
    ...booksResource.generateCourses.toMutation(),
    onSuccess: (data) => {
      toast.success(t("generateCoursesModal.success", { count: data.length }))
      queryClient.invalidateQueries({
        queryKey: coursesResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: booksResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: GenerateCoursesFromBookInput) => {
    const targetBookId = currentBook?.id || values.bookId
    if (!targetBookId) {
      toast.error(t("validation.bookRequired"))
      return
    }

    generateMutation.mutate({
      id: targetBookId,
      body: {
        ...values,
        bookId: targetBookId,
        termsCount: Number(values.termsCount),
        startingPrerequisiteId:
          values.startingPrerequisiteId === "none" ||
          !values.startingPrerequisiteId
            ? null
            : values.startingPrerequisiteId,
        instituteId: activeInstituteId || undefined,
      },
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("generateCoursesModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {/* Book Selector (if not pre-locked) */}
            {!initialBook ? (
              <Field data-invalid={Boolean(errors.bookId)}>
                <FieldLabel>{t("generateCoursesModal.selectBook")}</FieldLabel>
                <Controller
                  control={control}
                  name="bookId"
                  render={({ field }) => (
                    <ResponsiveCombobox
                      items={bookOptions}
                      value={field.value}
                      onValueChange={(val) => field.onChange(val)}
                      placeholder={t(
                        "generateCoursesModal.selectBookPlaceholder"
                      )}
                      drawerTitle={t("generateCoursesModal.selectBook")}
                      className="w-full"
                    />
                  )}
                />
                <FieldError>{errors.bookId?.message}</FieldError>
              </Field>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/30 p-3.5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">
                    {t("generateCoursesModal.selectBook")}
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    {currentBook?.title}
                  </span>
                </div>
              </div>
            )}

            {/* Terms Count & Format */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.termsCount)}>
                <FieldLabel>{t("generateCoursesModal.termsCount")}</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  {...register("termsCount", { valueAsNumber: true })}
                  placeholder={t("generateCoursesModal.termsCountPlaceholder")}
                />
                <FieldError>{errors.termsCount?.message}</FieldError>
                <FieldDescription>
                  {t("generateCoursesModal.termsCountHint")}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>
                  {t("generateCoursesModal.namingFormat")}
                </FieldLabel>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant={namingFormat === "PART" ? "default" : "outline"}
                    onClick={() => setValue("namingFormat", "PART")}
                    className="h-14 rounded-2xl text-sm font-medium"
                  >
                    Part
                  </Button>
                  <Button
                    type="button"
                    variant={namingFormat === "TERM" ? "default" : "outline"}
                    onClick={() => setValue("namingFormat", "TERM")}
                    className="h-14 rounded-2xl text-sm font-medium"
                  >
                    Term
                  </Button>
                </div>
              </Field>
            </div>

            {/* Base Fee */}
            <Field data-invalid={Boolean(errors.baseFee)}>
              <FieldLabel>{t("generateCoursesModal.baseFee")}</FieldLabel>
              <Controller
                control={control}
                name="baseFee"
                render={({ field }) => (
                  <PriceInput
                    value={field.value}
                    onValueChange={(val) => field.onChange(val ?? 0)}
                    placeholder={t("generateCoursesModal.feePlaceholder")}
                  />
                )}
              />
              <FieldError>{errors.baseFee?.message}</FieldError>
            </Field>

            {/* Starting Prerequisite */}
            <Field>
              <FieldLabel>
                {t("generateCoursesModal.startingPrerequisite")}
              </FieldLabel>
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
                    placeholder={t("generateCoursesModal.none")}
                    drawerTitle={t("generateCoursesModal.startingPrerequisite")}
                    className="w-full"
                  />
                )}
              />
            </Field>

            {/* Live Preview Carousel of Generated Courses */}
            {previewItems.length > 0 && (
              <CoursesPreviewCarousel items={previewItems} />
            )}
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={generateMutation.isPending}
            >
              {t("generateCoursesModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={generateMutation.isPending || !currentBook}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {generateMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {t("generateCoursesModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
