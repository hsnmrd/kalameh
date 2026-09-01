"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { PERMISSIONS, type StudentNoteDto } from "@workspace/types"
import { cn } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { studentsResource } from "@/lib/api"

export interface StudentProfileNotesProps {
  studentId: string
  initialNotes?: StudentNoteDto[]
}

export function StudentProfileNotes({
  studentId,
  initialNotes = [],
}: StudentProfileNotesProps) {
  const t = useTranslations("students")
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [newNote, setNewNote] = React.useState("")
  const [notes, setNotes] = React.useState<StudentNoteDto[]>(initialNotes)

  const addNoteMutation = useMutation({
    ...studentsResource.addNote.toMutation(),
    onSuccess: (updatedStudent) => {
      setNotes(updatedStudent.studentProfile?.notes || [])
      setNewNote("")
      queryClient.invalidateQueries({
        queryKey: studentsResource.list.baseKey(),
      })
      toast.success(t("profileModal.noteAdded"))
    },
  })

  const handleAddNote = () => {
    const content = newNote.trim()
    if (!content || addNoteMutation.isPending) return

    addNoteMutation.mutate({
      id: studentId,
      content,
    })
  }

  const formattedNotes = notes.map((note) => {
    const author = note.createdBy || note.createdByUser
    const authorName = author ? `${author.firstName} ${author.lastName}` : "—"

    const createdDate = new Intl.DateTimeFormat(
      locale === "fa" ? "fa-IR" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(new Date(note.createdAt))

    return {
      id: note.id,
      content: note.content,
      authorName,
      createdDate,
    }
  })

  return (
    <div className="col-span-2">
      <span className="text-xs text-muted-foreground">
        {t("editModal.notes")}
      </span>
      {formattedNotes.length === 0 ? (
        <p className="font-mono text-muted-foreground">—</p>
      ) : (
        <div className="space-y-2 pt-1">
          {formattedNotes.map((note, index) => (
            <div
              key={note.id}
              className={cn(
                "rounded-md border border-border/60 bg-muted/30 px-3 py-2",
                index === 0 && "bg-muted/60"
              )}
            >
              <p className="text-sm text-foreground">{note.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {note.authorName} · {note.createdDate}
              </p>
            </div>
          ))}
        </div>
      )}

      <PermissionGuard
        permission={PERMISSIONS.MANAGE_STUDENT_NOTES}
        mode="hide"
      >
        <div className="mt-2 space-y-2">
          <Field>
            <FieldLabel>{t("profileModal.addNote")}</FieldLabel>
            <Input
              value={newNote}
              onChange={(event) => setNewNote(event.target.value)}
              placeholder={t("profileModal.addNotePlaceholder")}
              className="h-11"
            />
          </Field>

          <Button
            type="button"
            size="sm"
            onClick={handleAddNote}
            disabled={addNoteMutation.isPending || !newNote.trim()}
            className="h-11 rounded-xl"
          >
            {addNoteMutation.isPending ? (
              <Spinner className="size-4" />
            ) : (
              t("profileModal.addNoteButton")
            )}
          </Button>
        </div>
      </PermissionGuard>
    </div>
  )
}
