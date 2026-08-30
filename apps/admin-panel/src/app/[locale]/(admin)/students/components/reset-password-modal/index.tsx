"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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
import { PasswordInput } from "@workspace/ui/components/password-input"
import {
  Field,
  FieldLabel,
  FieldDescription,
} from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import type { StudentDto } from "@workspace/types"
import { studentsResource } from "@/lib/api"

export interface ResetPasswordModalProps {
  student: StudentDto | null
  open: boolean
  onClose: () => void
}

export function ResetPasswordModal({
  student,
  open,
  onClose,
}: ResetPasswordModalProps) {
  const t = useTranslations("students")
  const queryClient = useQueryClient()
  const [newPassword, setNewPassword] = React.useState("")

  const fullName = student ? `${student.firstName} ${student.lastName}` : ""

  const resetMutation = useMutation({
    ...studentsResource.resetPassword.toMutation(),
    onSuccess: (data) => {
      toast.success(data?.message || t("resetPasswordModal.success"))
      queryClient.invalidateQueries({
        queryKey: studentsResource.list.baseKey(),
      })
      setNewPassword("")
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    resetMutation.mutate({
      id: student.id,
      newPassword: newPassword.trim() || undefined,
    })
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNewPassword("")
      onClose()
    }
  }

  return (
    <FormDialog open={open} onOpenChange={handleOpenChange}>
      <FormDialogContent className="sm:max-w-md">
        <FormDialogHeader>
          <FormDialogTitle>{t("resetPasswordModal.title")}</FormDialogTitle>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {student && (
              <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs">
                <span className="text-muted-foreground">{fullName}</span>
              </div>
            )}
            <Field>
              <FieldLabel>{t("resetPasswordModal.newPassword")}</FieldLabel>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("resetPasswordModal.passwordPlaceholder")}
              />
              <FieldDescription>
                {t("resetPasswordModal.passwordHint")}
              </FieldDescription>
            </Field>
          </div>

          <FormDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-14 min-w-24 rounded-2xl px-6 text-base font-medium"
            >
              {t("resetPasswordModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={resetMutation.isPending}
              className="h-14 min-w-32 rounded-2xl bg-primary px-8 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              {resetMutation.isPending && (
                <Spinner className="me-2 size-5 text-primary-foreground" />
              )}
              <span>{t("resetPasswordModal.submit")}</span>
            </Button>
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
