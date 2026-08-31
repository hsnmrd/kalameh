"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations, useLocale } from "next-intl"
import { useMutation } from "@tanstack/react-query"
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
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"
import { Phone, GraduationCap } from "lucide-react"
import {
  PERMISSIONS,
  type StudentDto,
  type StudentNoteDto,
} from "@workspace/types"
import { cn, getAssetUrl } from "@workspace/ui/lib/utils"
import { PermissionGuard } from "@/components/permission-guard"
import { StudentStatusBadge } from "../student-status-badge"
import { studentsResource } from "@/lib/api"

export interface StudentProfileModalProps {
  student: StudentDto | null
  open: boolean
  onClose: () => void
}

export function StudentProfileModal({
  student,
  open,
  onClose,
}: StudentProfileModalProps) {
  const t = useTranslations("students")
  const locale = useLocale()
  const [newNote, setNewNote] = React.useState("")
  const [notes, setNotes] = React.useState<StudentNoteDto[]>([])

  React.useEffect(() => {
    if (student) {
      setNotes(student.studentProfile?.notes || [])
    }
  }, [student])

  const addNoteMutation = useMutation({
    ...studentsResource.addNote.toMutation(),
    onSuccess: (updatedStudent) => {
      setNotes(updatedStudent.studentProfile?.notes || [])
      setNewNote("")
      toast.success(t("profileModal.noteAdded"))
    },
  })

  const handleAddNote = () => {
    if (!student) return
    const content = newNote.trim()
    if (!content || addNoteMutation.isPending) return

    addNoteMutation.mutate({
      id: student.id,
      content,
    })
  }

  if (!student) return null

  const fullName = `${student.firstName} ${student.lastName}`
  const initial = student.firstName?.[0] || student.lastName?.[0] || "S"

  const formattedBirthDate = student.studentProfile?.birthDate
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(student.studentProfile.birthDate))
    : "—"

  const formattedCreatedDate = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  ).format(new Date(student.createdAt))

  const formattedNotes = notes.map((note) => ({
    id: note.id,
    content: note.content,
    authorName: note.createdBy
      ? `${note.createdBy.firstName} ${note.createdBy.lastName}`
      : "—",
    createdDate: new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(note.createdAt)),
  }))

  return (
    <FormDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <FormDialogContent className="sm:max-w-xl">
        <FormDialogHeader>
          <FormDialogTitle>{t("profileModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {/* Header Card with Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {student.avatarUrl ? (
                <Image
                  src={getAssetUrl(student.avatarUrl)}
                  alt={fullName}
                  width={56}
                  height={56}
                  className="size-14 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground sm:text-lg">
                {fullName}
              </h3>
              <p className="flex items-center gap-1.5 pt-0.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" />
                <span className="font-mono">{student.phone}</span>
              </p>
            </div>
            <StudentStatusBadge isActive={student.isActive} />
          </div>

          {/* Identity & Personal Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
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
                  <Field data-invalid={addNoteMutation.isError}>
                    <FieldLabel>{t("profileModal.addNote")}</FieldLabel>
                    <Input
                      value={newNote}
                      onChange={(event) => setNewNote(event.target.value)}
                      placeholder={t("profileModal.addNotePlaceholder")}
                      className="h-11"
                    />
                    <FieldError>
                      {addNoteMutation.isError
                        ? t("profileModal.addNoteFailed")
                        : null}
                    </FieldError>
                  </Field>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={
                      addNoteMutation.isPending || !newNote.trim() || !student
                    }
                    className="h-11 rounded-xl"
                  >
                    {t("profileModal.addNoteButton")}
                  </Button>
                </div>
              </PermissionGuard>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.fatherName")}
              </span>
              <p className="font-medium text-foreground">
                {student.studentProfile?.fatherName || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.nationalCode")}
              </span>
              <p className="font-mono font-medium text-foreground">
                {student.nationalCode || "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("createModal.birthDate")}
              </span>
              <p className="font-medium text-foreground">
                {formattedBirthDate}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("createModal.gender")}
              </span>
              <p className="font-medium text-foreground">
                {student.studentProfile?.gender === "MALE"
                  ? t("createModal.genderMale")
                  : student.studentProfile?.gender === "FEMALE"
                    ? t("createModal.genderFemale")
                    : "—"}
              </p>
            </div>
          </div>

          {/* Contact & Address */}
          {(student.studentProfile?.emergencyPhone ||
            student.studentProfile?.address) && (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {student.studentProfile?.emergencyPhone && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    {t("createModal.emergencyPhone")}
                  </span>
                  <p className="font-mono font-medium text-foreground">
                    {student.studentProfile.emergencyPhone}
                  </p>
                </div>
              )}
              {student.studentProfile?.address && (
                <div>
                  <span className="text-xs text-muted-foreground">
                    {t("createModal.address")}
                  </span>
                  <p className="font-medium text-foreground">
                    {student.studentProfile.address}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Academic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.currentLevel")}
              </span>
              <div className="pt-1">
                {student.currentAllowedCourse ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs text-primary"
                  >
                    <GraduationCap className="size-3" />
                    <span>{student.currentAllowedCourse.title}</span>
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("table.noLevel")}
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                {t("table.createdAt")}
              </span>
              <p className="font-medium text-foreground">
                {formattedCreatedDate}
              </p>
            </div>
          </div>
        </div>

        <FormDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-14 min-w-28 rounded-2xl px-6 text-base font-medium"
          >
            {t("profileModal.close")}
          </Button>
        </FormDialogFooter>
      </FormDialogContent>
    </FormDialog>
  )
}
