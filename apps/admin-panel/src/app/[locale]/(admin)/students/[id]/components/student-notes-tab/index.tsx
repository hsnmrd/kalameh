"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { FileText, Plus, User } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import type { StudentDto } from "@workspace/types"

export interface StudentNotesTabProps {
  student: StudentDto
  onAddNote: () => void
}

export function StudentNotesTab({ student, onAddNote }: StudentNotesTabProps) {
  const t = useTranslations("students")
  const locale = useLocale()

  const notes = student.studentProfile?.notes || []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-foreground" />
          <h4 className="text-sm font-bold text-foreground sm:text-base">
            <span>یادداشت‌ها و توضیحات پرونده</span>
          </h4>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onAddNote}
          className="h-9 gap-1.5 rounded-xl px-3 text-xs font-semibold"
        >
          <Plus className="size-3.5" />
          <span>{t("actions.addNote")}</span>
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-xs text-muted-foreground">
          <p>هنوز یادداشتی برای این زبان‌آموز ثبت نشده است.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddNote}
            className="mt-3 gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Plus className="size-3.5" />
            <span>ثبت اولین یادداشت</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => {
            const author = note.createdBy || note.createdByUser
            const authorName = author
              ? `${author.firstName} ${author.lastName}`
              : "مدیر سیستم"

            const formattedDate = new Intl.DateTimeFormat(
              locale === "fa" ? "fa-IR" : "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            ).format(new Date(note.createdAt))

            return (
              <div
                key={note.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-2xs"
              >
                <p className="text-sm leading-relaxed text-foreground">
                  {note.content}
                </p>

                <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3 text-muted-foreground" />
                    <span>{authorName}</span>
                  </div>
                  <span>{formattedDate}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
