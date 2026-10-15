"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
import { FromBookForm, type SelectedBookConfig } from "./from-book-form"

export interface CreateGroupCoursesModalProps {
  open: boolean
  onClose: () => void
}

export function CreateGroupCoursesModal({
  open,
  onClose,
}: CreateGroupCoursesModalProps) {
  const t = useTranslations("courses")
  const queryClient = useQueryClient()
  const { activeInstituteId } = useActiveInstitute()

  const [selectedBooks, setSelectedBooks] = React.useState<
    Record<string, SelectedBookConfig>
  >({})

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

  React.useEffect(() => {
    if (open) {
      setSelectedBooks({})
    }
  }, [open])

  const batchGenerateMutation = useMutation({
    ...booksResource.batchGenerateCourses.toMutation(),
    onSuccess: (data) => {
      toast.success(
        t("createGroupModal.successFromBooksBatch", {
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
          baseFee: undefined,
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
            baseFee: undefined,
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const items = Object.entries(selectedBooks).map(([bookId, config]) => ({
      bookId,
      termsCount: Number(config.termsCount) || 1,
      baseFee: Number(config.baseFee) || 0,
      startingPrerequisiteId: config.startingPrerequisiteId || null,
      namingFormat: "INDEX" as const,
    }))

    if (items.length === 0) {
      toast.error(t("createGroupModal.noBooksSelected"))
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

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-h-[90dvh] sm:max-w-xl md:max-w-2xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("createGroupModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={onSubmit}
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
              disabled={batchGenerateMutation.isPending}
            >
              {t("createGroupModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                batchGenerateMutation.isPending || selectedBooksCount === 0
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {batchGenerateMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              {totalCoursesCount > 0
                ? t("createGroupModal.submitFromBooksBatch", {
                    count: formatNumber(totalCoursesCount),
                  })
                : t("createGroupModal.submit")}
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
