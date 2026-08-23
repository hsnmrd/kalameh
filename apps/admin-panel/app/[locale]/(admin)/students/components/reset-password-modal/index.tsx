"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@workspace/ui/components/sonner"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogCloseButton,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogCloseButton />
        <DialogHeader className="mb-4 text-start">
          <DialogTitle>{t("resetPasswordModal.title")}</DialogTitle>
          <DialogDescription>
            {t("resetPasswordModal.description", { name: fullName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>{t("resetPasswordModal.newPassword")}</FieldLabel>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 rounded-xl"
              placeholder={t("resetPasswordModal.passwordPlaceholder")}
            />
            <FieldDescription>
              {t("resetPasswordModal.passwordHint")}
            </FieldDescription>
          </Field>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-xl"
            >
              {t("resetPasswordModal.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={resetMutation.isPending}
              className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {resetMutation.isPending && (
                <Spinner className="me-2 size-4 text-primary-foreground" />
              )}
              <span>{t("resetPasswordModal.submit")}</span>
            </Button>
          </div>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
