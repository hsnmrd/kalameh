"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatNumber } from "@workspace/ui/lib/utils"
import { coursesResource, booksResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useCreateCourseSchema,
  type CreateCourseInput,
} from "../../hooks/use-course-schemas"
import { SingleCourseForm } from "./single-course-form"
import { FromBookForm, type SelectedBookConfig } from "./from-book-form"

export interface CreateCourseModalProps {
  open: boolean
  onClose: () => void
}

export function CreateCourseModal({ open, onClose }: CreateCourseModalProps) {
  const t = useTranslations("courses")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const [mode, setMode] = React.useState<"single" | "fromBook">("single")

  // Multi-book configuration state
  const [selectedBooks, setSelectedBooks] = React.useState<
    Record<string, SelectedBookConfig>
  >({})

  const createCourseSchema = useCreateCourseSchema()

  // Courses list for prerequisites
  const { data: allCourses = [] } = useQuery({
    ...coursesResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: open && !!activeInstituteId,
  })

  // Books list for selection
  const { data: allBooks = [] } = useQuery({
    ...booksResource.list.toQuery({ instituteId: activeInstituteId }),
    enabled: open && !!activeInstituteId,
  })

  const prerequisiteOptions = React.useMemo(
    () => [
      { value: "none", label: t("createModal.none") },
      ...allCourses.map((c) => ({ value: c.id, label: c.title })),
    ],
    [allCourses, t]
  )

  const bookOptions = React.useMemo(
    () => [
      { value: "none", label: t("createModal.none") },
      ...allBooks.map((b) => ({ value: b.id, label: b.title })),
    ],
    [allBooks, t]
  )

  // Single Course Form
  const singleForm = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      baseFee: 1500000,
      prerequisiteId: null,
      bookId: null,
    },
  })

  React.useEffect(() => {
    if (open) {
      setMode("single")
      setSelectedBooks({})
      singleForm.reset({
        title: "",
        baseFee: 1500000,
        prerequisiteId: null,
        bookId: null,
      })
    }
  }, [open, singleForm])

  const createMutation = useMutation({
    ...coursesResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: coursesResource.list.baseKey(),
      })
      onClose()
    },
  })

  const batchGenerateMutation = useMutation({
    ...booksResource.batchGenerateCourses.toMutation(),
    onSuccess: (data) => {
      toast.success(
        t("createModal.successFromBooksBatch", {
          count: formatNumber(data.length),
        })
      )
      queryClient.invalidateQueries({
        queryKey: coursesResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: booksResource.list.baseKey(),
      })
      onClose()
    },
  })

  const handleToggleBook = React.useCallback((bookId: string) => {
    setSelectedBooks((prev) => {
      const next = { ...prev }
      if (next[bookId]) {
        delete next[bookId]
      } else {
        next[bookId] = {
          termsCount: 3,
          baseFee: 1500000,
          startingPrerequisiteId: null,
        }
      }
      return next
    })
  }, [])

  const handleUpdateBook = React.useCallback(
    (bookId: string, patch: Partial<SelectedBookConfig>) => {
      setSelectedBooks((prev) => {
        if (!prev[bookId]) return prev
        return {
          ...prev,
          [bookId]: { ...prev[bookId], ...patch },
        }
      })
    },
    []
  )

  const handleSelectAll = React.useCallback(() => {
    setSelectedBooks((prev) => {
      const next = { ...prev }
      for (const b of allBooks) {
        if (!next[b.id]) {
          next[b.id] = {
            termsCount: 3,
            baseFee: 1500000,
            startingPrerequisiteId: null,
          }
        }
      }
      return next
    })
  }, [allBooks])

  const handleClearAll = React.useCallback(() => {
    setSelectedBooks({})
  }, [])

  const totalCoursesCount = React.useMemo(() => {
    return Object.values(selectedBooks).reduce(
      (sum, item) => sum + (Number(item.termsCount) || 1),
      0
    )
  }, [selectedBooks])

  const selectedBooksCount = Object.keys(selectedBooks).length

  const onSingleSubmit = (values: CreateCourseInput) => {
    createMutation.mutate({
      ...values,
      prerequisiteId:
        values.prerequisiteId === "none" || !values.prerequisiteId
          ? null
          : values.prerequisiteId,
      bookId: values.bookId === "none" || !values.bookId ? null : values.bookId,
      instituteId: activeInstituteId || undefined,
    })
  }

  const onBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const items = Object.entries(selectedBooks).map(([bookId, config]) => ({
      bookId,
      termsCount: Number(config.termsCount) || 1,
      baseFee: Number(config.baseFee) || 0,
      startingPrerequisiteId: config.startingPrerequisiteId || null,
      namingFormat: "INDEX" as const,
    }))

    if (items.length === 0) {
      toast.error(t("createModal.noBooksSelected"))
      return
    }

    batchGenerateMutation.mutate({
      items,
      instituteId: activeInstituteId || undefined,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  const isPending = createMutation.isPending || batchGenerateMutation.isPending

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="max-h-[90vh] sm:max-w-xl md:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        {/* Mode Switcher Tabs */}
        {allBooks.length > 0 && (
          <div className="border-b border-border/60 px-4 pt-3 sm:px-6">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted/50 p-1">
              <Button
                type="button"
                variant={mode === "single" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("single")}
                className="h-9 rounded-lg text-xs font-semibold"
              >
                {t("createModal.modeSingle")}
              </Button>
              <Button
                type="button"
                variant={mode === "fromBook" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("fromBook")}
                className="h-9 rounded-lg text-xs font-semibold"
              >
                {t("createModal.modeFromBook")}
              </Button>
            </div>
          </div>
        )}

        {mode === "single" ? (
          <form
            onSubmit={singleForm.handleSubmit(onSingleSubmit)}
            className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
          >
            <SingleCourseForm
              register={singleForm.register}
              control={singleForm.control}
              errors={singleForm.formState.errors}
              prerequisiteOptions={prerequisiteOptions}
              bookOptions={bookOptions}
            />

            <FormDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                {t("createModal.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createMutation.isPending && (
                  <Spinner className="me-2 size-5 text-primary-foreground" />
                )}
                {t("createModal.submit")}
              </Button>
            </FormDialogFooter>
          </form>
        ) : (
          <form
            onSubmit={onBatchSubmit}
            className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
          >
            <FromBookForm
              books={allBooks}
              courses={allCourses}
              selectedBooks={selectedBooks}
              onToggleBook={handleToggleBook}
              onUpdateBook={handleUpdateBook}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
            />

            <FormDialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                {t("createModal.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending || selectedBooksCount === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {batchGenerateMutation.isPending && (
                  <Spinner className="me-2 size-5 text-primary-foreground" />
                )}
                {totalCoursesCount > 0
                  ? t("createModal.submitFromBooksBatch", {
                      count: formatNumber(totalCoursesCount),
                    })
                  : t("createModal.submitFromBook")}
              </Button>
            </FormDialogFooter>
          </form>
        )}
      </FormDialogContent>
    </FormDialog>
  )
}
