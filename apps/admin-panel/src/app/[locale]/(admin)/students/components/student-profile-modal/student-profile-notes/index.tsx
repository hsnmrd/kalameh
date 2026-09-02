"use client"

import * as React from "react"
import { useTranslations, useLocale } from "next-intl"
import type { StudentNoteDto } from "@workspace/types"
import { cn } from "@workspace/ui/lib/utils"

export interface StudentProfileNotesProps {
  studentId?: string
  initialNotes?: StudentNoteDto[]
}

export function StudentProfileNotes({
  initialNotes = [],
}: StudentProfileNotesProps) {
  const t = useTranslations("students")
  const locale = useLocale()

  const formattedNotes = initialNotes.map((note) => {
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
        <p className="pt-1 text-sm text-muted-foreground">—</p>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto pt-1">
          {formattedNotes.map((note, index) => (
            <div
              key={note.id}
              className={cn(
                "rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs",
                index === 0 && "bg-muted/60"
              )}
            >
              <p className="text-sm font-medium text-foreground">
                {note.content}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {note.authorName} · {note.createdDate}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
