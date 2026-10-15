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
import { SingleCourseForm } from "./single-course-form"

export interface CreateCourseModalProps {
  open: boolean
  onClose: () => void
}

export function CreateCourseModal({ open, onClose }: CreateCourseModalProps) {
  const t = useTranslations("courses")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

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

  const form = useForm<CreateCourseInput>({
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
      form.reset({
        title: "",
        baseFee: 1500000,
        prerequisiteId: null,
        bookId: null,
      })
    }
  }, [open, form])

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

  const onSubmit = (values: CreateCourseInput) => {
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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="max-h-[90vh] sm:max-w-xl md:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <SingleCourseForm
            register={form.register}
            control={form.control}
            errors={form.formState.errors}
            prerequisiteOptions={prerequisiteOptions}
            bookOptions={bookOptions}
          />

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              {t("createModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {t("createModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
