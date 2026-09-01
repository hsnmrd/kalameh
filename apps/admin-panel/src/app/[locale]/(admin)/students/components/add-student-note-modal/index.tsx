"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import Image from "next/image"
import { GraduationCap, Phone } from "lucide-react"
import {
  FormDialog,
  FormDialogContent,
  FormDialogHeader,
  FormDialogTitle,
  FormDialogCloseButton,
  FormDialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Textarea } from "@workspace/ui/components/textarea"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { getAssetUrl } from "@workspace/ui/lib/utils"
import { StudentStatusBadge } from "../student-status-badge"
import type { StudentDto } from "@workspace/types"
import { studentsResource } from "@/lib/api"

export interface AddStudentNoteModalProps {
  student: StudentDto | null
  open: boolean
  onClose: () => void
}

export function AddStudentNoteModal({
  student,
  open,
  onClose,
}: AddStudentNoteModalProps) {
  const t = useTranslations("students")
  const queryClient = useQueryClient()
  const [content, setContent] = React.useState("")

  const fullName = student ? `${student.firstName} ${student.lastName}` : ""
  const studentInitial = (
    student?.firstName?.[0] ||
    student?.lastName?.[0] ||
    "S"
  ).toUpperCase()

  const addNoteMutation = useMutation({
    ...studentsResource.addNote.toMutation(),
    onSuccess: () => {
      toast.success(t("addNoteModal.success"))
      queryClient.invalidateQueries({
        queryKey: studentsResource.list.baseKey(),
      })
      setContent("")
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!student || !content.trim()) return

    addNoteMutation.mutate({
      id: student.id,
      content: content.trim(),
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setContent("")
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("addNoteModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {student && (
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {student.avatarUrl ? (
                      <Image
                        src={getAssetUrl(student.avatarUrl)}
                        alt={fullName}
                        width={48}
                        height={48}
                        className="size-12 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span>{studentInitial}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {fullName}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3.5 text-muted-foreground" />
                      <span className="font-mono">{student.phone}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StudentStatusBadge isActive={student.isActive} />
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/30 bg-primary/10 text-primary"
                    >
                      <GraduationCap className="size-3" />
                      <span>
                        {student.currentAllowedCourse?.title ||
                          t("table.noLevel")}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {student ? (
              <p className="text-xs text-muted-foreground">
                {t("addNoteModal.description", {
                  name: fullName,
                })}
              </p>
            ) : null}

            <Field>
              <FieldLabel>{t("addNoteModal.note")}</FieldLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("addNoteModal.notePlaceholder")}
                rows={4}
                autoFocus
              />
            </Field>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("addNoteModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={addNoteMutation.isPending || !content.trim()}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {addNoteMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              <span>{t("addNoteModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
