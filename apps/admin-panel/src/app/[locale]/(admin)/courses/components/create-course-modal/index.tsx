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
import { coursesResource, booksResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useCreateCourseSchema,
  type CreateCourseInput,
} from "../../hooks/use-course-schemas"
import {
  useGenerateCoursesFromBookSchema,
  type GenerateCoursesFromBookInput,
} from "../../../books/hooks/use-book-schemas"
import { SingleCourseForm } from "./single-course-form"
import { FromBookForm } from "./from-book-form"

export interface CreateCourseModalProps {
  open: boolean
  onClose: () => void
}

export function CreateCourseModal({ open, onClose }: CreateCourseModalProps) {
  const t = useTranslations("courses")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const [mode, setMode] = React.useState<"single" | "fromBook">("single")

  const createCourseSchema = useCreateCourseSchema()
  const generateSchema = useGenerateCoursesFromBookSchema()

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

  // Form 1: Single Course Form
  const singleForm = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      baseFee: 1500000,
      prerequisiteId: null,
      bookId: null,
    },
  })

  // Form 2: From Book Form
  const fromBookForm = useForm<GenerateCoursesFromBookInput>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      bookId: "",
      termsCount: 3,
      baseFee: 1500000,
      startingPrerequisiteId: null,
      namingFormat: "PART",
    },
  })

  React.useEffect(() => {
    if (open) {
      setMode("single")
      singleForm.reset({
        title: "",
        baseFee: 1500000,
        prerequisiteId: null,
        bookId: null,
      })
      fromBookForm.reset({
        bookId: allBooks[0]?.id || "",
        termsCount: 3,
        baseFee: 1500000,
        startingPrerequisiteId: null,
        namingFormat: "PART",
      })
    }
  }, [open, allBooks, singleForm, fromBookForm])

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

  const generateMutation = useMutation({
    ...booksResource.generateCourses.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.successFromBook"))
      queryClient.invalidateQueries({
        queryKey: coursesResource.list.baseKey(),
      })
      queryClient.invalidateQueries({
        queryKey: booksResource.list.baseKey(),
      })
      onClose()
    },
  })

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

  const onFromBookSubmit = (values: GenerateCoursesFromBookInput) => {
    if (!values.bookId) {
      toast.error(t("createModal.selectBook"))
      return
    }

    generateMutation.mutate({
      id: values.bookId,
      body: {
        ...values,
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

  const isPending = createMutation.isPending || generateMutation.isPending

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-lg">
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
            onSubmit={fromBookForm.handleSubmit(onFromBookSubmit)}
            className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
          >
            <FromBookForm
              register={fromBookForm.register}
              control={fromBookForm.control}
              errors={fromBookForm.formState.errors}
              books={allBooks}
              courses={allCourses}
              selectedBookId={fromBookForm.watch("bookId")}
              termsCount={fromBookForm.watch("termsCount")}
              startingPrereqId={fromBookForm.watch("startingPrerequisiteId")}
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
                {generateMutation.isPending && (
                  <Spinner className="me-2 size-5 text-primary-foreground" />
                )}
                {t("createModal.submitFromBook")}
              </Button>
            </FormDialogFooter>
          </form>
        )}
      </FormDialogContent>
    </FormDialog>
  )
}
