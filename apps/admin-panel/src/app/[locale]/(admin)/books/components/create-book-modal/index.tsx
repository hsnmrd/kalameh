"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { booksResource } from "@/lib/api"
import { useActiveInstitute } from "@/lib/stores"
import {
  useCreateBookSchema,
  type CreateBookInput,
} from "../../hooks/use-book-schemas"

export interface CreateBookModalProps {
  open: boolean
  onClose: () => void
}

export function CreateBookModal({ open, onClose }: CreateBookModalProps) {
  const t = useTranslations("books")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()
  const createBookSchema = useCreateBookSchema()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBookInput>({
    resolver: zodResolver(createBookSchema),
    defaultValues: {
      title: "",
      author: "",
      publisher: "",
      description: "",
    },
  })

  React.useEffect(() => {
    if (open) {
      reset({
        title: "",
        author: "",
        publisher: "",
        description: "",
      })
    }
  }, [open, reset])

  const createMutation = useMutation({
    ...booksResource.create.toMutation(),
    onSuccess: () => {
      toast.success(t("createModal.success"))
      queryClient.invalidateQueries({
        queryKey: booksResource.list.baseKey(),
      })
      onClose()
    },
  })

  const onSubmit = (values: CreateBookInput) => {
    createMutation.mutate({
      ...values,
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
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("createModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel>{t("createModal.bookTitle")}</FieldLabel>
              <Input
                {...register("title")}
                placeholder={t("createModal.titlePlaceholder")}
              />
              <FieldError>{errors.title?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel>{t("createModal.author")}</FieldLabel>
              <Input
                {...register("author")}
                placeholder={t("createModal.authorPlaceholder")}
              />
            </Field>

            <Field>
              <FieldLabel>{t("createModal.publisher")}</FieldLabel>
              <Input
                {...register("publisher")}
                placeholder={t("createModal.publisherPlaceholder")}
              />
            </Field>

            <Field>
              <FieldLabel>{t("createModal.description")}</FieldLabel>
              <Input
                {...register("description")}
                placeholder={t("createModal.descriptionPlaceholder")}
              />
            </Field>
          </div>

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
