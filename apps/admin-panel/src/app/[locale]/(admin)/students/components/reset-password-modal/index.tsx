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
  FormDialogDescription,
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
      <FormDialogContent className="max-w-md">
        <FormDialogHeader>
          <div className="space-y-1">
            <FormDialogTitle>{t("resetPasswordModal.title")}</FormDialogTitle>
            <FormDialogDescription>
              {t("resetPasswordModal.description", { name: fullName })}
            </FormDialogDescription>
          </div>
          <FormDialogCloseButton />
        </FormDialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-3 pb-6 sm:px-0 sm:py-0">
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
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </FormDialog>
  )
}
